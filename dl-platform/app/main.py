import asyncio
import json
import logging
import os
import secrets
import shutil
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urlencode

from fastapi import Depends, FastAPI, HTTPException, status, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse, StreamingResponse
from starlette.background import BackgroundTask
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx
from pydantic import BaseModel
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    cookie_policy,
)
from app.config import settings
from app.database import AsyncSessionLocal, Base, engine, get_session
from app.email import email_service
from app.file_store import (
    cleanup_expired_tokens,
    cleanup_orphan_files,
    consume_file_token,
    create_file_token,
    resolve_file_token,
)
from app.models import ApiKey, Plan, Proxy, Subscription, SystemSetting, Transaction, UsageLog, User
from app.platforms import build_platform_engines, get_engine, PLATFORM_ENGINES
from app.platforms.base import DOWNLOAD_DIR
from app.quota import get_quota, increment_usage, rate_limit_check
from app.schemas import (
    APIResponse,
    ApiKeyCreate,
    ApiKeyCreatedOut,
    ApiKeyOut,
    DownloadRequest,
    ErrorDetail,
    ForgotPasswordRequest,
    InfoRequest,
    LoginRequest,
    PlanCreate,
    PlanOut,
    PlanUpdate,
    ProfileUpdate,
    ProxyCreate,
    QuotaOut,
    RegisterRequest,
    ResetPasswordRequest,
    SubscriptionAdminOut,
    SystemSettingOut,
    SystemSettingUpdate,
    TransactionOut,
)
from app.tasks import run_cleanup

log = logging.getLogger("dlt.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    import re
    masked = re.sub(r"(://[^:]*:)[^@]*(@)", r"\1***\2", settings.DATABASE_URL)
    print(f"[startup] DATABASE_URL={masked}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed default Free plan
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Plan).where(Plan.name == "Free").limit(1))
        if not result.scalar_one_or_none():
            session.add(Plan(name="Free", monthly_requests=100, price=0.0, active=True))
            await session.commit()

        # (Proxy seeding removed; manage proxies via admin panel)

        # Initialize proxy rotators for all platforms
        await build_platform_engines(session)

    task = asyncio.create_task(run_cleanup())
    yield
    task.cancel()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

def _normalize_origin(origin: str) -> str:
    # Browsers send origins without a trailing slash. Render/env values often
    # include one, which makes every CORS check fail and blocks login requests.
    return origin.strip().rstrip("/")


_cors_origins = {_normalize_origin(settings.FRONTEND_URL)}
_cors_origins.update(
    _normalize_origin(origin)
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
)
_cors_origins.discard("")
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(_cors_origins),
    allow_origin_regex=settings.CORS_ORIGIN_REGEX or r"https://.*\.cc\.cd",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _frontend_url() -> str:
    return settings.FRONTEND_URL.rstrip("/") or "http://localhost:3000"


def _request_id() -> str:
    return f"dl_{uuid.uuid4().hex[:12]}"


def _is_expired(value: Optional[datetime]) -> bool:
    if value is None:
        return False
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value < datetime.now(timezone.utc)


def _platform_response(success: bool, platform: str, request_id: str, data=None, error=None):
    if isinstance(error, str):
        error = ErrorDetail(code=_error_code(error, 400), message=error)
    return APIResponse(
        success=success,
        platform=platform,
        data=data,
        request_id=request_id,
        error=error,
        detail=error.message if error else None,
    )


_ERROR_CODES = {
    400: "INVALID_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "INVALID_REQUEST",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
    502: "UPSTREAM_ERROR",
}

_ACCOUNT_PATHS = {"account", "files", "plans", "health"}


def _error_code(message: str, status_code: int) -> str:
    """Map a legacy ``detail`` string to a stable machine-readable code."""
    text = (message or "").strip().lower()
    if text == "quota_exceeded" or "quota exceeded" in text:
        return "QUOTA_EXCEEDED"
    if text == "rate_limited" or "rate limit" in text:
        return "RATE_LIMITED"
    if "does not match platform" in text:
        return "INVALID_URL"
    if "unknown platform" in text:
        return "NOT_FOUND"
    if "api key" in text:
        return "UNAUTHORIZED"
    if "not found" in text or "no longer available" in text:
        return "NOT_FOUND"
    if "expired" in text:
        return "EXPIRED"
    if "unsupported url" in text:
        return "INVALID_URL"
    return _ERROR_CODES.get(status_code, "ERROR")


def _engine_error_code(message: str) -> str:
    """Map an extraction/download failure to a documented error code."""
    text = (message or "").strip().lower()
    if "unsupported url" in text or "invalid url" in text or "is not a valid url" in text:
        return "INVALID_URL"
    if any(
        token in text
        for token in (
            "not available",
            "unavailable",
            "not found",
            "does not exist",
            "private video",
            "removed",
            "no video",
            "404",
        )
    ):
        return "NOT_FOUND"
    return "UPSTREAM_ERROR"


def _engine_error_status(code: str) -> int:
    return {
        "INVALID_URL": status.HTTP_400_BAD_REQUEST,
        "NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "UPSTREAM_ERROR": status.HTTP_502_BAD_GATEWAY,
    }.get(code, status.HTTP_400_BAD_REQUEST)


def _platform_from_path(path: str) -> Optional[str]:
    parts = [part for part in (path or "").split("/") if part]
    if len(parts) >= 3 and parts[0] == "v1" and parts[1] == "dlt" and parts[2] not in _ACCOUNT_PATHS:
        return parts[2]
    return None


def _error_response(
    *,
    platform: Optional[str],
    request_id: Optional[str],
    code: str,
    message: str,
    status_code: int,
    retry_after: Optional[int] = None,
    extra_headers: Optional[dict] = None,
) -> JSONResponse:
    payload = {
        "success": False,
        "platform": platform,
        "request_id": request_id or _request_id(),
        "data": None,
        "error": {"code": code, "message": message, "retry_after": retry_after},
        "detail": message,
    }
    headers = dict(extra_headers or {})
    if retry_after is not None:
        headers["Retry-After"] = str(retry_after)
    return JSONResponse(status_code=status_code, content=payload, headers=headers or None)


@app.exception_handler(HTTPException)
async def _http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        raw_message = str(detail.get("message") or detail.get("detail") or "Request failed")
        code = str(detail.get("code") or _error_code(raw_message, exc.status_code))
        retry_after = detail.get("retry_after")
    else:
        raw_message = str(detail)
        code = _error_code(raw_message, exc.status_code)
        retry_after = None

    message = {
        "QUOTA_EXCEEDED": "Monthly request quota reached.",
        "RATE_LIMITED": "Too many requests. Please retry shortly.",
        "UNAUTHORIZED": "Missing or invalid API key.",
    }.get(code, raw_message)

    if retry_after is None and code == "RATE_LIMITED":
        retry_after = 60
    if exc.headers and exc.headers.get("Retry-After") is not None:
        retry_after = int(exc.headers["Retry-After"])

    passthrough_headers = {
        key: value
        for key, value in (exc.headers or {}).items()
        if key.lower() != "retry-after"
    }

    return _error_response(
        platform=_platform_from_path(request.url.path),
        request_id=_request_id(),
        code=code,
        message=message,
        status_code=exc.status_code,
        retry_after=retry_after,
        extra_headers=passthrough_headers,
    )


@app.exception_handler(RequestValidationError)
async def _validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    message = "Invalid request body."
    code = "INVALID_REQUEST"
    if errors:
        first = errors[0]
        location = ".".join(
            str(part) for part in first.get("loc", ()) if part not in ("body", "query", "path")
        )
        reason = first.get("msg", "Invalid value")
        message = f"{location}: {reason}" if location else reason
        if location.split(".")[-1] in {"url", "format", "quality", "format_id"}:
            code = "INVALID_URL" if "url" in location else "INVALID_REQUEST"
    return _error_response(
        platform=_platform_from_path(request.url.path),
        request_id=_request_id(),
        code=code,
        message=message,
        status_code=status.HTTP_400_BAD_REQUEST,
    )


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled error on %s %s", request.method, request.url.path)
    return _error_response(
        platform=_platform_from_path(request.url.path),
        request_id=_request_id(),
        code="INTERNAL_ERROR",
        message="Unexpected server error. Please retry.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "plan": user.plan.name if user.plan else None,
        "email_verified": user.email_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


async def _account_quota(user: User, session: AsyncSession) -> dict:
    return await get_quota(user.id, session)


async def _record_usage(
    session: AsyncSession,
    user: User,
    platform: str,
    url: str,
    success: bool,
    file_size: Optional[int] = None,
) -> None:
    session.add(
        UsageLog(
            user_id=user.id,
            product=platform,
            url=url,
            status="success" if success else "error",
            file_size=file_size,
        )
    )
    await session.commit()


async def _recent_usage_rows(user_id: int, session: AsyncSession, since: datetime):
    result = await session.execute(
        select(UsageLog.created_at, UsageLog.status, UsageLog.product).where(
            UsageLog.user_id == user_id,
            UsageLog.created_at >= since,
        )
    )
    return result.all()


def _log_payload(log: UsageLog) -> dict:
    return {
        "id": log.id,
        "platform": log.product,
        "url": log.url,
        "status": log.status,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


def _as_utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


async def _usage_summary(user_id: int, session: AsyncSession, days: int = 7) -> dict:
    now = datetime.now(timezone.utc)
    start_date = now.date() - timedelta(days=days - 1)
    since = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    rows = await _recent_usage_rows(user_id, session, since)

    buckets = {
        start_date + timedelta(days=index): {"requests": 0, "errors": 0}
        for index in range(days)
    }
    platform_counts: dict[str, int] = {}
    total = 0
    errors = 0

    for created_at, status_value, product in rows:
        created = _as_utc(created_at)
        if created is None:
            continue
        bucket = buckets.get(created.date())
        if bucket is None:
            continue
        bucket["requests"] += 1
        if status_value != "success":
            bucket["errors"] += 1
            errors += 1
        total += 1
        platform_counts[product] = platform_counts.get(product, 0) + 1

    day_payload = [
        {
            "date": day.isoformat(),
            "day": day.strftime("%a"),
            "requests": values["requests"],
            "errors": values["errors"],
        }
        for day, values in buckets.items()
    ]
    platform_payload = [
        {
            "platform": platform,
            "requests": count,
            "percentage": round((count / total) * 100) if total else 0,
        }
        for platform, count in sorted(platform_counts.items(), key=lambda item: item[1], reverse=True)
    ]

    error_result = await session.execute(
        select(UsageLog)
        .where(UsageLog.user_id == user_id, UsageLog.status != "success")
        .order_by(UsageLog.id.desc())
        .limit(10)
    )
    recent_errors = [_log_payload(log) for log in error_result.scalars().all()]

    return {
        "totals": {
            "total": total,
            "errors": errors,
            "success_rate": round(((total - errors) / total) * 100, 1) if total else 100.0,
            "last_7_days": total,
        },
        "days": day_payload,
        "platforms": platform_payload,
        "recent_errors": recent_errors,
    }


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
    body: RegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    email = body.email.lower().strip()
    password = body.password
    name = body.name
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

    admin_emails = {
        item.strip().lower() for item in settings.ADMIN_EMAILS.split(",") if item.strip()
    }
    user = User(
        email=email,
        password_hash=hash_password(password),
        name=name,
        plan_id=plan.id,
        status="active",
        role="admin" if email in admin_emails else "user",
        email_verified=True,
    )
    session.add(user)
    await session.commit()

    return {
        "id": user.id,
        "email": user.email,
        "message": "Registration successful.",
        "email_verified": True,
    }


@app.post("/v1/auth/login")
async def login(
    request: Request,
    response: Response,
    body: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    email = body.email.lower().strip()
    password = body.password
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
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "plan": user.plan.name if user.plan else None,
        },
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


@app.get("/v1/auth/me")
async def me(user: User = Depends(require_auth_user)):
    return _user_payload(user)


@app.get("/v1/auth/verify-email")
async def verify_email(
    token: str,
    json: bool = False,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(User).where(User.email_verification_token == token)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")
    if _is_expired(user.email_verification_expires):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification token expired")

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    await session.commit()

    if json:
        return {"message": "Email verified", "email": user.email}

    # Send welcome email
    await email_service.send_welcome_email(user.email, user.name)

    return RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard?verified=true")


@app.post("/v1/auth/forgot-password")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_session),
):
    email = body.email.lower().strip()
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

    reset_code = generate_reset_token()
    user.password_reset_token = reset_code
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    await session.commit()

    await email_service.send_password_reset_email(email, reset_code, user.name)
    if settings.DEBUG:
        print(f"[DEV] Reset code for {email}: {reset_code}")

    return {"message": "If the email exists, a reset code has been sent"}


@app.post("/v1/auth/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(User).where(User.password_reset_token == body.token)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset token")
    if _is_expired(user.password_reset_expires):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token expired")

    user.password_hash = hash_password(body.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    await session.commit()

    return {"message": "Password reset successful"}


# Google OAuth

def _google_redirect_uri() -> str:
    """Keep the OAuth callback on the frontend origin.

    The browser talks to the frontend origin, which proxies /v1/* to this API.
    Returning to the API host would put the session cookie on the wrong host.
    """
    frontend = _frontend_url()
    configured = settings.GOOGLE_REDIRECT_URI.strip()
    if configured.startswith(f"{frontend}/"):
        return configured
    return f"{frontend}/v1/auth/google/callback"


def _google_failure(reason: str) -> RedirectResponse:
    response = RedirectResponse(url=f"{_frontend_url()}/login?error={reason}")
    response.delete_cookie("oauth_state", path="/")
    return response


@app.get("/v1/auth/google/login")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return _google_failure("google_not_configured")

    state = secrets.token_urlsafe(24)
    params = urlencode(
        {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": _google_redirect_uri(),
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "select_account",
            "state": state,
        }
    )
    response = RedirectResponse(url=f"{settings.GOOGLE_AUTH_URL}?{params}")
    secure, samesite = cookie_policy()
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=600,
        path="/",
    )
    return response


@app.get("/v1/auth/google/callback")
async def google_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    if error or not code:
        return _google_failure("google_cancelled")
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return _google_failure("google_not_configured")

    expected_state = request.cookies.get("oauth_state")
    if not expected_state or not state or not secrets.compare_digest(expected_state, state):
        return _google_failure("google_state_mismatch")

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            token_response = await client.post(
                settings.GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": _google_redirect_uri(),
                    "grant_type": "authorization_code",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_response.raise_for_status()
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            if not access_token:
                raise ValueError("Google token response did not include an access token")

            userinfo_response = await client.get(
                settings.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            userinfo_response.raise_for_status()
            info = userinfo_response.json()
    except Exception as exc:  # noqa: BLE001
        print(f"[google-oauth] token exchange failed: {exc}")
        return _google_failure("google_exchange_failed")

    google_id = str(info.get("sub") or "")
    email = str(info.get("email") or "").lower().strip()
    if not google_id or not email:
        return _google_failure("google_no_email")
    if str(info.get("email_verified", "true")).lower() == "false":
        return _google_failure("google_email_unverified")

    result = await session.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()
    if user is None:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

    if user is None:
        result = await session.execute(select(Plan).where(Plan.name == "Free").limit(1))
        plan = result.scalar_one_or_none()
        if plan is None:
            plan = Plan(name="Free", monthly_requests=100, price=0.0, active=True)
            session.add(plan)
            await session.flush()

        admin_emails = {
            item.strip().lower() for item in settings.ADMIN_EMAILS.split(",") if item.strip()
        }
        user = User(
            email=email,
            name=info.get("name") or email.split("@")[0],
            google_id=google_id,
            plan_id=plan.id,
            status="active",
            role="admin" if email in admin_emails else "user",
            email_verified=True,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    else:
        if user.status != "active":
            return _google_failure("account_inactive")
        if not user.google_id:
            user.google_id = google_id
        if not user.email_verified:
            user.email_verified = True
        await session.commit()

    destination = "/admin/dashboard" if user.role == "admin" else "/dashboard"
    response = RedirectResponse(url=f"{_frontend_url()}{destination}")
    set_auth_cookies(
        response,
        create_access_token(user.id, user.email),
        create_refresh_token(user.id),
    )
    response.delete_cookie("oauth_state", path="/")
    return response


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
    body: ApiKeyCreate,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    from app.auth import generate_api_key, hash_api_key

    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)
    api_key = ApiKey(
        user_id=user.id,
        key_hash=key_hash,
        name=body.name,
        platforms=body.platforms or [],
        status="active",
    )
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    payload = ApiKeyOut.model_validate(api_key).model_dump()
    payload.pop("key", None)
    return ApiKeyCreatedOut(**payload, key=raw_key)


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


@app.get("/v1/session/account/overview")
async def session_overview(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    quota = await _account_quota(user, session)
    usage = await _usage_summary(user.id, session)

    key_result = await session.execute(select(ApiKey.status).where(ApiKey.user_id == user.id))
    statuses = key_result.scalars().all()

    recent_result = await session.execute(
        select(UsageLog)
        .where(UsageLog.user_id == user.id)
        .order_by(UsageLog.id.desc())
        .limit(5)
    )
    recent = [_log_payload(log) for log in recent_result.scalars().all()]

    return {
        "user": _user_payload(user),
        "quota": quota,
        "keys": {
            "total": len(statuses),
            "active": sum(1 for status in statuses if status == "active"),
        },
        "usage": usage["totals"],
        "days": usage["days"],
        "platforms": usage["platforms"],
        "recent_errors": usage["recent_errors"],
        "recent": recent,
    }


@app.get("/v1/session/account/usage")
async def session_usage(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    usage = await _usage_summary(user.id, session)
    usage["quota"] = await _account_quota(user, session)
    return usage


@app.get("/v1/session/account/logs")
async def session_logs(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    query = select(UsageLog).where(UsageLog.user_id == user.id)
    count_query = select(func.count(UsageLog.id)).where(UsageLog.user_id == user.id)
    if status_filter == "error":
        query = query.where(UsageLog.status != "success")
        count_query = count_query.where(UsageLog.status != "success")
    elif status_filter == "success":
        query = query.where(UsageLog.status == "success")
        count_query = count_query.where(UsageLog.status == "success")

    total = (await session.execute(count_query)).scalar_one()
    result = await session.execute(
        query.order_by(UsageLog.id.desc()).limit(limit).offset(offset)
    )
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [_log_payload(log) for log in result.scalars().all()],
    }


@app.get("/v1/session/account/subscription")
async def session_subscription(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    quota = await _account_quota(user, session)
    sub_result = await session.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id)
        .order_by(Subscription.id.desc())
        .limit(1)
    )
    sub = sub_result.scalar_one_or_none()

    tx_result = await session.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.id.desc())
        .limit(20)
    )
    transactions = [
        {
            "id": tx.id,
            "amount": float(tx.amount),
            "currency": tx.currency,
            "method": tx.method,
            "status": tx.status,
            "ref": tx.ref,
            "created_at": tx.created_at.isoformat() if tx.created_at else None,
        }
        for tx in tx_result.scalars().all()
    ]

    return {
        "user": _user_payload(user),
        "plan": {
            "id": user.plan.id,
            "name": user.plan.name,
            "monthly_requests": user.plan.monthly_requests,
            "price": float(user.plan.price) if user.plan.price is not None else None,
        }
        if user.plan
        else None,
        "quota": quota,
        "subscription": {
            "status": sub.status,
            "start": sub.start.isoformat() if sub.start else None,
            "end": sub.end.isoformat() if sub.end else None,
            "auto_renew": sub.auto_renew,
        }
        if sub
        else None,
        "transactions": transactions,
    }


class SubscriptionChange(BaseModel):
    plan_id: int


@app.patch("/v1/session/account/subscription")
async def session_change_subscription(
    body: SubscriptionChange,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Plan).where(Plan.id == body.plan_id, Plan.active == True))  # noqa: E712
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found or inactive")

    user.plan_id = plan.id
    await session.commit()
    await session.refresh(user)

    return {
        "plan": {
            "id": plan.id,
            "name": plan.name,
            "monthly_requests": plan.monthly_requests,
            "price": float(plan.price) if plan.price is not None else None,
        },
        "message": f"Plan changed to {plan.name}",
    }


@app.patch("/v1/session/account/profile")
async def session_update_profile(
    body: ProfileUpdate,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Name is required")
    user.name = name
    await session.commit()
    await session.refresh(user)
    return _user_payload(user)


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
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="RATE_LIMITED",
            headers={"Retry-After": "60"},
        )

    info, error = await engine_.extract_info(str(body.url))
    if error:
        await increment_usage(user.id, session)
        await _record_usage(session, user, platform, str(body.url), False)
        code = _engine_error_code(error)
        return _error_response(
            platform=platform,
            request_id=rid,
            code=code,
            message=error,
            status_code=_engine_error_status(code),
        )

    await increment_usage(user.id, session)
    await _record_usage(session, user, platform, str(body.url), True)
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
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="RATE_LIMITED",
            headers={"Retry-After": "60"},
        )

    # Reclaim disk from expired tokens and abandoned files before a new
    # download, otherwise a small ephemeral disk fills up and every request
    # fails with an opaque 500.
    try:
        cleanup_expired_tokens()
        cleanup_orphan_files(settings.DOWNLOAD_ORPHAN_MAX_AGE_SECONDS)
    except OSError:
        log.warning("Download cleanup failed", exc_info=True)

    try:
        free_mb = shutil.disk_usage(DOWNLOAD_DIR).free // (1024 * 1024)
    except OSError:
        free_mb = None
    if free_mb is not None and free_mb < settings.MIN_FREE_DISK_MB:
        return _error_response(
            platform=platform,
            request_id=rid,
            code="INSUFFICIENT_STORAGE",
            message="Not enough disk space on the server. Please try a lower quality.",
            status_code=status.HTTP_507_INSUFFICIENT_STORAGE,
        )

    # Explicit format id wins, then requested quality, then the legacy
    # ``format`` field ("mp4"/"mp3"/"720p"/...).
    selected_format = body.format_id or body.quality or body.format
    file_path, info, error = await engine_.download(str(body.url), format_id=selected_format)
    if error:
        await increment_usage(user.id, session)
        await _record_usage(session, user, platform, str(body.url), False)
        code = _engine_error_code(error)
        return _error_response(
            platform=platform,
            request_id=rid,
            code=code,
            message=error,
            status_code=_engine_error_status(code),
        )

    await increment_usage(user.id, session)
    file_size = None
    if file_path and os.path.exists(file_path):
        try:
            file_size = os.path.getsize(file_path)
        except OSError:
            file_size = None
    await _record_usage(session, user, platform, str(body.url), True, file_size=file_size)

    try:
        file_token = create_file_token(file_path, settings.FILE_URL_TTL_SECONDS)
    except OSError:
        log.exception("Could not persist download token for %s", file_path)
        try:
            os.remove(file_path)
        except OSError:
            pass
        return _error_response(
            platform=platform,
            request_id=rid,
            code="INTERNAL_ERROR",
            message="Could not store the downloaded file. Please retry.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    download_url = f"/v1/dlt/files/{file_token}"

    data = {
        "download_url": download_url,
        "title": (info or {}).get("title"),
        "duration": (info or {}).get("duration"),
        "extractor": (info or {}).get("extractor"),
        "expires_in": settings.FILE_URL_TTL_SECONDS,
        "file_size": file_size,
    }
    return _platform_response(True, platform, rid, data=data)


@app.get("/v1/dlt/files/{file_token}")
async def download_file(file_token: str):
    entry = resolve_file_token(file_token)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found or expired")

    file_path, _expires_at = entry
    if not os.path.exists(file_path):
        consume_file_token(file_token)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File no longer available")

    def cleanup():
        consume_file_token(file_token)
        try:
            os.remove(file_path)
        except OSError:
            pass

    def iter_file():
        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                yield chunk

    import urllib.parse

    raw_name = os.path.basename(file_path)
    # HTTP headers are latin-1; send an ASCII fallback plus RFC 5987 UTF-8.
    ascii_name = raw_name.encode("ascii", "replace").decode("ascii").replace("?", "_")
    encoded_name = urllib.parse.quote(raw_name, safe="")
    return StreamingResponse(
        iter_file(),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{ascii_name}"; '
                f"filename*=UTF-8''{encoded_name}"
            )
        },
        background=BackgroundTask(cleanup),
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
    body: ApiKeyCreate,
    user: User = Depends(get_api_key_user),
    session: AsyncSession = Depends(get_session),
):
    from app.auth import generate_api_key, hash_api_key

    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)
    api_key = ApiKey(
        user_id=user.id,
        key_hash=key_hash,
        name=body.name,
        platforms=body.platforms or [],
        status="active",
    )
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    payload = ApiKeyOut.model_validate(api_key).model_dump()
    payload.pop("key", None)
    return ApiKeyCreatedOut(**payload, key=raw_key)


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
    return {
        "status": "ok",
        "version": settings.APP_VERSION,
        "download_timeout": settings.DOWNLOAD_TIMEOUT_SECONDS,
        "platforms": list(PLATFORM_ENGINES.keys()),
    }


@app.get("/v1/dlt/plans", response_model=list[PlanOut])
async def list_plans(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Plan).where(Plan.active == True))  # noqa: E712
    return result.scalars().all()


# ============================================================================
# API CONFIGURATION (System Settings)
# ============================================================================

@app.get("/v1/session/account/settings", response_model=list[SystemSettingOut])
async def list_settings(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(SystemSetting).order_by(SystemSetting.key))
    return result.scalars().all()


@app.post("/v1/session/account/settings", response_model=SystemSettingOut)
async def upsert_setting(
    body: SystemSettingUpdate,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = await session.execute(
        select(SystemSetting).where(SystemSetting.key == body.key)
    )
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = body.value
    else:
        setting = SystemSetting(key=body.key, value=body.value)
        session.add(setting)
    await session.commit()
    await session.refresh(setting)
    return setting


# ============================================================================
# TRANSACTIONS
# ============================================================================

@app.get("/v1/session/account/transactions", response_model=list[TransactionOut])
async def list_transactions(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
    limit: int = 50,
    offset: int = 0,
):
    limit = max(1, min(limit, 200))
    offset = max(0, offset)
    result = await session.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


# ============================================================================
# INVOICES (generated from completed transactions)
# ============================================================================

@app.get("/v1/session/account/invoices")
async def list_invoices(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id, Transaction.status == "completed")
        .order_by(Transaction.created_at.desc())
        .limit(100)
    )
    transactions = result.scalars().all()
    return [
        {
            "id": f"inv-{tx.id}",
            "transaction_id": tx.id,
            "amount": float(tx.amount),
            "currency": tx.currency,
            "method": tx.method,
            "status": tx.status,
            "ref": tx.ref,
            "created_at": tx.created_at.isoformat() if tx.created_at else None,
            "pdf_url": f"/v1/session/account/invoices/{tx.id}",
        }
        for tx in transactions
    ]


@app.get("/v1/session/account/invoices/{transaction_id}")
async def get_invoice(
    transaction_id: int,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Transaction).where(
            Transaction.id == transaction_id, Transaction.user_id == user.id
        )
    )
    tx = result.scalar_one_or_none()
    if tx is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return {
        "id": f"inv-{tx.id}",
        "transaction_id": tx.id,
        "amount": float(tx.amount),
        "currency": tx.currency,
        "method": tx.method,
        "status": tx.status,
        "ref": tx.ref,
        "created_at": tx.created_at.isoformat() if tx.created_at else None,
        "user_email": user.email,
        "user_name": user.name,
    }


# ============================================================================
# ADMIN PLANS & SUBSCRIPTIONS
# ============================================================================

@app.get("/v1/admin/plans", response_model=list[PlanOut])
async def admin_list_plans(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = await session.execute(select(Plan).order_by(Plan.id))
    return result.scalars().all()


@app.post("/v1/admin/plans", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
async def admin_create_plan(
    body: PlanCreate,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    plan = Plan(
        name=body.name,
        monthly_requests=body.monthly_requests,
        price=body.price,
        active=body.active,
    )
    session.add(plan)
    await session.commit()
    await session.refresh(plan)
    return plan


@app.put("/v1/admin/plans/{plan_id}", response_model=PlanOut)
async def admin_update_plan(
    plan_id: int,
    body: PlanUpdate,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = await session.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    if body.name is not None:
        plan.name = body.name
    if body.monthly_requests is not None:
        plan.monthly_requests = body.monthly_requests
    if body.price is not None:
        plan.price = body.price
    if body.active is not None:
        plan.active = body.active
    await session.commit()
    await session.refresh(plan)
    return plan


@app.delete("/v1/admin/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_plan(
    plan_id: int,
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = await session.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    # Unassign users from this plan first (nullable FK)
    await session.execute(
        update(User).where(User.plan_id == plan_id).values(plan_id=None)
    )
    # Delete subscriptions referencing this plan
    await session.execute(delete(Subscription).where(Subscription.plan_id == plan_id))
    await session.delete(plan)
    await session.commit()
    return None


@app.get("/v1/admin/subscriptions", response_model=list[SubscriptionAdminOut])
async def admin_list_subscriptions(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = await session.execute(
        select(Subscription)
        .options(selectinload(Subscription.plan), selectinload(Subscription.user))
        .order_by(Subscription.start.desc())
    )
    subs = result.scalars().all()
    out = []
    for sub in subs:
        out.append({
            "id": sub.id,
            "user_id": sub.user_id,
            "user_email": sub.user.email if sub.user else "unknown",
            "plan": sub.plan,
            "status": sub.status,
            "start": sub.start,
            "end": sub.end,
            "auto_renew": sub.auto_renew,
        })
    return out


# ============================================================================
# ADMIN OVERVIEW
# ============================================================================

@app.get("/v1/admin/overview")
async def admin_overview(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    last_24h = now - timedelta(hours=24)

    total_users = (await session.execute(select(func.count(User.id)))).scalar_one()
    new_users = (
        await session.execute(
            select(func.count(User.id)).where(User.created_at >= month_start)
        )
    ).scalar_one()
    active_subs = (
        await session.execute(
            select(func.count(Subscription.id)).where(Subscription.status == "active")
        )
    ).scalar_one()
    active_keys = (
        await session.execute(
            select(func.count(ApiKey.id)).where(ApiKey.status == "active")
        )
    ).scalar_one()
    monthly_revenue = (
        await session.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.status == "completed",
                Transaction.created_at >= month_start,
            )
        )
    ).scalar_one()

    total_logged = (await session.execute(select(func.count(UsageLog.id)))).scalar_one()
    today_requests = (
        await session.execute(
            select(func.count(UsageLog.id)).where(UsageLog.created_at >= day_start)
        )
    ).scalar_one()
    failed_24h = (
        await session.execute(
            select(func.count(UsageLog.id)).where(
                UsageLog.status != "success",
                UsageLog.created_at >= last_24h,
            )
        )
    ).scalar_one()
    requests_24h = (
        await session.execute(
            select(func.count(UsageLog.id)).where(UsageLog.created_at >= last_24h)
        )
    ).scalar_one()

    signup_result = await session.execute(
        select(User).order_by(User.id.desc()).limit(5)
    )
    signups = [
        {
            "id": item.id,
            "name": item.name,
            "email": item.email,
            "plan": item.plan.name if item.plan else None,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in signup_result.scalars().all()
    ]

    week_rows = await session.execute(
        select(UsageLog.created_at, UsageLog.status).where(
            UsageLog.created_at >= datetime.combine(
                now.date() - timedelta(days=6), datetime.min.time(), tzinfo=timezone.utc
            )
        )
    )
    buckets = {
        now.date() - timedelta(days=index): {"requests": 0, "errors": 0}
        for index in range(6, -1, -1)
    }
    for created_at, log_status in week_rows.all():
        created = _as_utc(created_at)
        if created is None or created.date() not in buckets:
            continue
        buckets[created.date()]["requests"] += 1
        if log_status != "success":
            buckets[created.date()]["errors"] += 1

    return {
        "users": {"total": total_users, "new_this_month": new_users},
        "subscriptions": {"active": active_subs},
        "revenue": {"month": float(monthly_revenue or 0)},
        "requests": {
            "today": today_requests,
            "last_24h": requests_24h,
            "failed_24h": failed_24h,
            "total_logged": total_logged,
            "error_rate": round((failed_24h / requests_24h) * 100, 1) if requests_24h else 0.0,
        },
        "keys": {"active": active_keys},
        "signups": signups,
        "days": [
            {
                "date": day.isoformat(),
                "day": day.strftime("%a"),
                "requests": values["requests"],
                "errors": values["errors"],
            }
            for day, values in buckets.items()
        ],
        "platforms": list(PLATFORM_ENGINES.keys()),
    }


# ============================================================================
# PROXY MANAGEMENT (Admin)
# ============================================================================

@app.get("/v1/admin/proxies")
async def list_proxies(
    user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    result = await session.execute(select(Proxy).order_by(Proxy.id.desc()))
    proxies = result.scalars().all()
    return [
        {
            "id": p.id,
            "type": p.type,
            "host": p.host,
            "port": p.port,
            "user": p.user,
            "platform": p.platform,
            "status": p.status,
            "last_checked": p.last_checked,
        }
        for p in proxies
    ]


@app.post("/v1/admin/proxies")
async def add_proxy(
    body: ProxyCreate,
    current_user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    proxy = Proxy(
        type=body.type,
        host=body.host,
        port=body.port,
        user=body.user,
        pass_encrypted=body.password,
        platform=body.platform,
        status="active",
    )
    session.add(proxy)
    await session.commit()
    await session.refresh(proxy)

    # Rebuild proxy rotators to include new proxy
    await build_platform_engines(session)

    return {"id": proxy.id, "message": "Proxy added"}


@app.delete("/v1/admin/proxies/{proxy_id}")
async def delete_proxy(
    proxy_id: int,
    current_user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    result = await session.execute(select(Proxy).where(Proxy.id == proxy_id))
    proxy = result.scalar_one_or_none()
    if proxy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proxy not found")

    await session.delete(proxy)
    await session.commit()

    # Rebuild proxy rotators
    await build_platform_engines(session)

    return {"message": "Proxy deleted"}


@app.patch("/v1/admin/proxies/{proxy_id}/toggle")
async def toggle_proxy(
    proxy_id: int,
    current_user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    result = await session.execute(select(Proxy).where(Proxy.id == proxy_id))
    proxy = result.scalar_one_or_none()
    if proxy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proxy not found")

    proxy.status = "inactive" if proxy.status == "active" else "active"
    await session.commit()

    await build_platform_engines(session)

    return {"id": proxy.id, "status": proxy.status}


@app.post("/v1/admin/proxies/{proxy_id}/check")
async def check_proxy(
    proxy_id: int,
    current_user: User = Depends(require_auth_user),
    session: AsyncSession = Depends(get_session),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    result = await session.execute(select(Proxy).where(Proxy.id == proxy_id))
    proxy = result.scalar_one_or_none()
    if proxy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proxy not found")

    scheme = proxy.type or "http"
    auth = ""
    if proxy.user and proxy.pass_encrypted:
        auth = f"{proxy.user}:{proxy.pass_encrypted}@"
    proxy_url = f"{scheme}://{auth}{proxy.host}:{proxy.port}"

    started = time.monotonic()
    try:
        async with httpx.AsyncClient(proxy=proxy_url, timeout=15) as client:
            response = await client.get("https://api.ipify.org")
        latency_ms = round((time.monotonic() - started) * 1000)
        ok = response.is_success
        proxy.status = "active" if ok else "error"
        proxy.last_checked = datetime.now(timezone.utc)
        await session.commit()
        return {
            "id": proxy.id,
            "ok": ok,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "ip": response.text.strip() if ok else None,
        }
    except Exception as exc:  # noqa: BLE001
        proxy.status = "error"
        proxy.last_checked = datetime.now(timezone.utc)
        await session.commit()
        return {
            "id": proxy.id,
            "ok": False,
            "error": str(exc),
            "latency_ms": round((time.monotonic() - started) * 1000),
        }


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
