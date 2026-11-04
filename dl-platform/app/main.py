import asyncio
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_api_key_user, hash_api_key, generate_api_key, security as api_key_security
from app.config import settings
from app.database import AsyncSessionLocal, Base, engine, get_session
from app.models import ApiKey, Plan, User
from app.platforms import get_engine, PLATFORM_ENGINES
from app.quota import get_quota, increment_usage, rate_limit_check
from app.schemas import (
    APIResponse,
    ApiKeyCreatedOut,
    ApiKeyOut,
    DownloadRequest,
    InfoRequest,
    PlanOut,
    QuotaOut,
)
from app.tasks import run_cleanup


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    task = asyncio.create_task(run_cleanup())
    yield
    task.cancel()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)


def _request_id() -> str:
    return f"dl_{uuid.uuid4().hex[:12]}"


def _platform_response(success: bool, platform: str, request_id: str, data=None, error=None):
    return APIResponse(success=success, platform=platform, data=data, request_id=request_id, error=error)


async def _enforce_quota(session: AsyncSession, user: User):
    quota = await get_quota(user.id, session)
    if quota["limit"] > 0 and quota["used"] >= quota["limit"]:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="QUOTA_EXCEEDED",
        )


# ---------------------------------------------------------------- session auth (for web UI)
session_security = HTTPBearer(auto_error=False)


def create_session_token(user_id: int) -> str:
    return f"dl_sess_{uuid.uuid4().hex}"


async def get_session_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(session_security),
    session: AsyncSession = Depends(get_session),
) -> Optional[User]:
    """Optional session auth - returns None if not authenticated (for public pages)."""
    if credentials is None or not credentials.credentials:
        return None
    token = credentials.credentials
    if not token.startswith("dl_sess_"):
        return None
    # In production, verify against a session store/Redis
    result = await session.execute(select(User).where(User.status == "active").limit(1))
    return result.scalar_one_or_none()


async def require_session_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(session_security),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Required session auth - for key management without needing an API key first."""
    user = await get_session_user(credentials, session)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please login first",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# ---------------------------------------------------------------- API v1 routes (with /v1/dlt/ prefix)
@app.post("/v1/dlt/{platform}/info", response_model=APIResponse)
async def platform_info(
    platform: str,
    body: InfoRequest,
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    engine_ = get_engine(platform)
    if engine_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown platform")
    if not engine_.matches(str(body.url)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="URL does not match platform")

    rid = _request_id()
    await _enforce_quota(session, user)

    rl_key = f"ratelimit:{user.id}:{platform}:info"
    allowed = await rate_limit_check(rl_key, limit=30, window_seconds=60)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="RATE_LIMITED")

    info, error = await engine_.extract_info(str(body.url))
    if error:
        await increment_usage(user.id, session)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=_platform_response(False, platform, rid, error=error).model_dump(),
        )

    await increment_usage(user.id, session)
    return _platform_response(True, platform, rid, data=info)


@app.post("/v1/dlt/{platform}/download", response_model=APIResponse)
async def platform_download(
    platform: str,
    body: DownloadRequest,
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    engine_ = get_engine(platform)
    if engine_ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown platform")
    if not engine_.matches(str(body.url)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="URL does not match platform")

    rid = _request_id()
    await _enforce_quota(session, user)

    rl_key = f"ratelimit:{user.id}:{platform}:download"
    allowed = await rate_limit_check(rl_key, limit=10, window_seconds=60)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="RATE_LIMITED")

    file_path, info, error = await engine_.download(str(body.url), format_id=body.format)
    if error:
        await increment_usage(user.id, session)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=_platform_response(False, platform, rid, error=error).model_dump(),
        )

    await increment_usage(user.id, session)

    # Return secure download URL instead of raw file_path
    download_url = f"/v1/dlt/files/{uuid.uuid4().hex}"
    # Store mapping in a simple in-memory dict (use Redis in production)
    if not hasattr(app.state, "download_map"):
        app.state.download_map = {}
    app.state.download_map[download_url] = file_path

    data = {
        "download_url": download_url,
        "title": (info or {}).get("title"),
        "duration": (info or {}).get("duration"),
        "extractor": (info or {}).get("extractor"),
        "expires_in": settings.DOWNLOAD_TIMEOUT_SECONDS,
    }
    return _platform_response(True, platform, rid, data=data)


@app.get("/v1/dlt/files/{file_token}")
async def download_file(file_token: str):
    """Serve downloaded file via secure token URL."""
    download_map = getattr(app.state, "download_map", {})
    file_path = download_map.get(file_token)
    if not file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found or expired")

    import os
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File no longer available")

    def iter_file():
        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                yield chunk

    return StreamingResponse(
        iter_file(),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{os.path.basename(file_path)}"'},
    )


# ---------------------------------------------------------------- session-based account routes (no API key needed first)
@app.post("/v1/auth/register", status_code=status.HTTP_201_CREATED)
async def register(
    email: str,
    password: str,
    name: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Create default free plan if none exists
    result = await session.execute(select(Plan).where(Plan.name == "Free").limit(1))
    plan = result.scalar_one_or_none()
    if plan is None:
        plan = Plan(name="Free", monthly_requests=100, price=0.0, active=True)
        session.add(plan)
        await session.flush()

    user = User(email=email, password_hash=hash_api_key(password), plan_id=plan.id, status="active", name=name)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return {"id": user.id, "email": user.email, "message": "Registered successfully"}


@app.post("/v1/auth/login")
async def login(
    email: str,
    password: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or user.password_hash != hash_api_key(password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account not active")

    token = create_session_token(user.id)
    if not hasattr(app.state, "session_map"):
        app.state.session_map = {}
    app.state.session_map[token] = user.id

    return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name}}


@app.post("/v1/auth/logout")
async def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(session_security),
):
    if credentials and credentials.credentials and hasattr(app.state, "session_map"):
        app.state.session_map.pop(credentials.credentials, None)
    return {"message": "Logged out"}


# Session-based key management (no API key required - uses session token)
@app.get("/v1/session/account/keys", response_model=list[ApiKeyOut])
async def session_list_keys(
    user: User = Depends(require_session_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(ApiKey).where(ApiKey.user_id == user.id))
    return result.scalars().all()


@app.post("/v1/session/account/keys", response_model=ApiKeyCreatedOut, status_code=status.HTTP_201_CREATED)
async def session_create_key(
    name: Optional[str] = None,
    platforms: Optional[list[str]] = None,
    user: User = Depends(require_session_user),
    session: AsyncSession = Depends(get_session),
):
    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)
    api_key = ApiKey(
        user_id=user.id,
        key_hash=key_hash,
        name=name,
        platforms=platforms or [],
        status="active",
    )
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    out = ApiKeyCreatedOut.model_validate(api_key)
    out.key = raw_key
    return out


@app.delete("/v1/session/account/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def session_delete_key(
    key_id: int,
    user: User = Depends(require_session_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user.id)
    )
    api_key = result.scalar_one_or_none()
    if api_key is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    await session.delete(api_key)
    await session.commit()
    return None


# ---------------------------------------------------------------- API-key-based account routes (original, keep for API clients)
@app.get("/v1/dlt/account/quota", response_model=QuotaOut)
async def account_quota(
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    quota = await get_quota(user.id, session)
    return quota


@app.get("/v1/dlt/account/keys", response_model=list[ApiKeyOut])
async def list_keys(
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(ApiKey).where(ApiKey.user_id == user.id))
    return result.scalars().all()


@app.post("/v1/dlt/account/keys", response_model=ApiKeyCreatedOut, status_code=status.HTTP_201_CREATED)
async def create_key_api(
    name: Optional[str] = None,
    platforms: Optional[list[str]] = None,
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)
    api_key = ApiKey(
        user_id=user.id,
        key_hash=key_hash,
        name=name,
        platforms=platforms or [],
        status="active",
    )
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    out = ApiKeyCreatedOut.model_validate(api_key)
    out.key = raw_key
    return out


@app.delete("/v1/dlt/account/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_key_api(
    key_id: int,
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user.id)
    )
    api_key = result.scalar_one_or_none()
    if api_key is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    await session.delete(api_key)
    await session.commit()
    return None


# ---------------------------------------------------------------- health & plans
@app.get("/health")
async def health():
    return {"status": "ok", "platforms": list(PLATFORM_ENGINES.keys())}


@app.get("/v1/dlt/plans", response_model=list[PlanOut])
async def list_plans(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Plan).where(Plan.active == True))  # noqa: E712
    return result.scalars().all()


# ---------------------------------------------------------------- static + pages (frontend)
WEB_DIR = Path(__file__).resolve().parent.parent / "web"
if WEB_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(WEB_DIR / "static")), name="static")

    def _page(path: str):
        async def _serve(request: Request):
            return FileResponse(str(WEB_DIR / path), media_type="text/html")
        return _serve

    @app.get("/")
    async def landing():
        return _page("landing/index.html")

    @app.get("/pricing")
    async def pricing():
        return _page("landing/pricing.html")

    @app.get("/dashboard")
    async def user_dashboard():
        return _page("user_dashboard/index.html")

    @app.get("/admin")
    async def admin_dashboard():
        return _page("admin_dashboard/index.html")
