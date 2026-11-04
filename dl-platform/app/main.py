import asyncio
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_api_key_user, hash_api_key
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
    # create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # start background cleanup
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


# ---------------------------------------------------------------- platform routes
@app.post("/{platform}/info", response_model=APIResponse)
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

    # rate limit per key + per user
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


@app.post("/{platform}/download", response_model=APIResponse)
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
    data = {
        "file_path": file_path,
        "title": (info or {}).get("title"),
        "duration": (info or {}).get("duration"),
        "extractor": (info or {}).get("extractor"),
    }
    return _platform_response(True, platform, rid, data=data)


# ---------------------------------------------------------------- account routes
@app.get("/account/quota", response_model=QuotaOut)
async def account_quota(
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    quota = await get_quota(user.id, session)
    return quota


@app.get("/account/keys", response_model=list[ApiKeyOut])
async def list_keys(
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(ApiKey).where(ApiKey.user_id == user.id))
    keys = result.scalars().all()
    return keys


@app.post("/account/keys", response_model=ApiKeyCreatedOut, status_code=status.HTTP_201_CREATED)
async def create_key(
    name: Optional[str] = None,
    platforms: Optional[list[str]] = None,
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    raw_key = settings.API_KEY_PREFIX + "_" + uuid.uuid4().hex
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


@app.delete("/account/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_key(
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


@app.get("/health")
async def health():
    return {"status": "ok", "platforms": list(PLATFORM_ENGINES.keys())}


# ---------------------------------------------------------------- public plans
@app.get("/plans", response_model=list[PlanOut])
async def list_plans(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Plan).where(Plan.active == True))  # noqa: E712
    return result.scalars().all()


# ---------------------------------------------------------------- static + pages
WEB_DIR = Path(__file__).resolve().parent.parent / "web"
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
