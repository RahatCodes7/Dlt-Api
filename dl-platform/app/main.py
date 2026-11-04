import asyncio
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request, Response
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    security as api_key_security,
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user_from_cookie,
    require_auth_user,
    get_api_key_user,
    generate_verification_token,
    generate_reset_token,
)
from app.config import settings
from app.database import AsyncSessionLocal, Base, engine, get_session
from app.email import email_service
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
    # Seed default Free plan
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Plan).where(Plan.name == "Free").limit(1))
        if not result.scalar_one_or_none():
            session.add(Plan(name="Free", monthly_requests=100, price=0.0, active=True))
            await session.commit()
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


# ============================================================================
# AUTH ROUTES
# ============================================================================

@app.post("/v1/auth/register")
async def register(
    request: Request,
    response: Response,
    email: str,
    password: str,
    name: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    # Rate limit registration per IP
    client_ip = request.client.host if request.client else "unknown"
    rl_key = f"ratelimit:register:{client_ip}"
    allowed = await rate_limit_check(rl_key, limit=5, window_seconds=3600)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many registration attempts")

    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    result = await session.execute(select(Plan).where(Plan.name == "Free").limit(1))
    plan = result.scalar_one_or_none()
    if plan is None:
        plan = Plan(name="Free", monthly_requests=100, price=0.0, active=True)
        session.add(plan)
        await session.flush()

    user = User(
        email=email,
        password_hash=hash_password(password),
        name=name,
        plan_id=plan.id,
        status="active",
        email_verified=False,
    )
    session.add(user)
    await session.flush()

    # Create email verification token
    verify_token_str = generate_verification_token()
    user.email_verification_token = verify_token_str
    user.email_verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    await session.commit()

    # Send verification email
    await email_service.send_verification_email(email, verify_token_str, name)

    return {
        "id": user.id,
        "email": user.email,
        "message": "Registration successful. Please verify your email.",
        "email_verified": False,
    }


@app.post("/v1/auth/login")
async def login(
    request: Request,
    response: Response,
    email: str,
    password: str,
    session: AsyncSession = Depends(get_session),
):
    # Rate limit login per IP
    client_ip = request.client.host if request.client else "unknown"
    rl_key = f"ratelimit:login:{client_ip}"
    allowed = await rate_limit_check(rl_key, limit=10, window_seconds=300)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many login attempts")

    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None or not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account not active")
    if not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")

    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id)
    set_auth_cookies(response, access_token, refresh_token)

    return {
        "user": {"id": user.id, "email": user.email, "name": user.name},
        "message": "Login successful",
    }


@app.post("/v1/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out"}


@app.post("/v1/auth/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    refresh_token_str = request.cookies.get("refresh_token")
    if not refresh_token_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    payload = verify_token(refresh_token_str)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = int(payload["sub"])
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(user.id, user.email)
    new_refresh = create_refresh_token(user.id)
    set_auth_cookies(response, access_token, new_refresh)

    return {"message": "Token refreshed"}


@app.get("/v1/auth/verify-email")
async def verify_email(
    token: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(User).where(User.email_verification_token == token)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")
    if user.email_verification_expires and user.email_verification_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification token expired")

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    await session.commit()

    # Send welcome email
    await email_service.send_welcome_email(user.email, user.name)

    return RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard?verified=true")


@app.post("/v1/auth/forgot-password")
async def forgot_password(
    request: Request,
    email: str,
    session: AsyncSession = Depends(get_session),
):
    # Rate limit per IP
    client_ip = request.client.host if request.client else "unknown"
    rl_key = f"ratelimit:forgot:{client_ip}"
    allowed = await rate_limit_check(rl_key, limit=3, window_seconds=3600)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many reset requests")

    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link has been sent"}

    if not user.password_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account uses social login")

    reset_token_str = generate_reset_token()
    user.password_reset_token = reset_token_str
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await session.commit()

    await email_service.send_password_reset_email(email, reset_token_str, user.name)

    return {"message": "If the email exists, a reset link has been sent"}


@app.post("/v1/auth/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(User).where(User.password_reset_token == token)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")
    if user.password_reset_expires and user.password_reset_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token expired")

    user.password_hash = hash_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    await session.commit()

    return {"message": "Password reset successful"}


# Google OAuth (placeholder - full implementation needs google-auth library)
@app.get("/v1/auth/google/login")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google OAuth not configured")
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid email profile"
        f"&access_type=offline"
    )
    return RedirectResponse(url=google_auth_url)


@app.get("/v1/auth/google/callback")
async def google_callback(
    code: str,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    # Placeholder - full implementation exchanges code for user info
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google OAuth callback not yet implemented")


# ============================================================================
# SESSION-BASED ACCOUNT ROUTES (for web UI - no API key needed first)
# ============================================================================

@app.get("/v1/session/account/keys", response_model=list[ApiKeyOut])
async def session_list_keys(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(ApiKey).where(ApiKey.user_id == user.id))
    return result.scalars().all()


@app.post("/v1/session/account/keys", response_model=ApiKeyCreatedOut, status_code=status.HTTP_201_CREATED)
async def session_create_key(
    name: Optional[str] = None,
    platforms: Optional[list[str]] = None,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    from app.auth import generate_api_key, hash_api_key

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
    user: User = Depends(require_auth_user),
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


# ============================================================================
# API ROUTES (/v1/dlt/ prefix)
# ============================================================================

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

    download_url = f"/v1/dlt/files/{uuid.uuid4().hex}"
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


# API-key-based account routes (for programmatic access)
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
    from app.auth import generate_api_key, hash_api_key

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


# ============================================================================
# HEALTH & PLANS
# ============================================================================

@app.get("/health")
async def health():
    return {"status": "ok", "platforms": list(PLATFORM_ENGINES.keys())}


@app.get("/v1/dlt/plans", response_model=list[PlanOut])
async def list_plans(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Plan).where(Plan.active == True))  # noqa: E712
    return result.scalars().all()


# ============================================================================
# STATIC + PAGES (frontend)
# ============================================================================

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
