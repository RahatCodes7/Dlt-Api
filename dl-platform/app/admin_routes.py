"""Admin-only endpoints for the admin console.

Everything here requires an authenticated session cookie and the ``admin``
role. Data comes from the real database (users, usage logs, transactions,
settings, support tickets, ...) — no placeholder payloads.
"""

import asyncio
import os
import re
import shutil
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import case, func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import require_auth_user
from app.config import settings
from app.database import get_session, AsyncSessionLocal
from app.models import (
    AdminLog,
    Announcement,
    ApiKey,
    ApiProduct,
    DocPage,
    FaqItem,
    Notification,
    Plan,
    Proxy,
    Subscription,
    SupportTicket,
    SystemSetting,
    TicketMessage,
    Transaction,
    UsageCounter,
    UsageLog,
    User,
    UserSession,
    UserSetting,
)
from app.platforms import PLATFORM_ENGINES
from app.platforms.base import DOWNLOAD_DIR
from app.quota import month_key, get_quota

router = APIRouter()

_ALLOWED_TRANSACTION_STATUS = {"pending", "completed", "failed", "refunded"}
_SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,49}$")
_STARTED_AT = time.time()


async def _require_admin(user: User = Depends(require_auth_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


async def _admin_log(session: AsyncSession, admin_id: Optional[int], action: str, target: Optional[str] = None):
    session.add(AdminLog(admin_id=admin_id, action=action, target=target))


# ---------------------------------------------------------------- settings --

async def get_setting(session: AsyncSession, key: str, default: Optional[str] = None) -> Optional[str]:
    result = await session.execute(select(SystemSetting).where(SystemSetting.key == key))
    row = result.scalar_one_or_none()
    return row.value if row is not None else default


async def get_settings_map(session: AsyncSession, prefix: str) -> dict:
    result = await session.execute(select(SystemSetting).where(SystemSetting.key.like(f"{prefix}%")))
    return {row.key: row.value for row in result.scalars().all()}


async def set_setting(session: AsyncSession, key: str, value: str) -> None:
    result = await session.execute(select(SystemSetting).where(SystemSetting.key == key))
    row = result.scalar_one_or_none()
    if row is not None:
        row.value = value
    else:
        session.add(SystemSetting(key=key, value=value))


async def set_settings(session: AsyncSession, values: dict) -> None:
    for key, value in values.items():
        await set_setting(session, key, str(value))
    await session.commit()


def _parse_bool(value: Optional[str], fallback: bool = False) -> bool:
    if value is None:
        return fallback
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _parse_int(value: Optional[str], fallback: int) -> int:
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return fallback


def _utc_iso(value):
    return value.isoformat() if value else None


# -------------------------------------------------------------------- users --

@router.get("/v1/admin/users")
async def admin_list_users(
    search: str = "",
    status_filter: str = Query("", alias="status"),
    plan_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    query = select(User)
    count_query = select(func.count(User.id))
    if search.strip():
        needle = f"%{search.strip().lower()}%"
        clause = func.lower(User.email).like(needle) | func.lower(func.coalesce(User.name, "")).like(needle)
        query = query.where(clause)
        count_query = count_query.where(clause)
    if status_filter.strip():
        query = query.where(User.status == status_filter.strip())
        count_query = count_query.where(User.status == status_filter.strip())
    if plan_id is not None:
        query = query.where(User.plan_id == plan_id)
        count_query = count_query.where(User.plan_id == plan_id)

    total = (await session.execute(count_query)).scalar_one()
    result = await session.execute(
        query.options(selectinload(User.plan))
        .order_by(User.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    users = result.scalars().all()

    month = month_key()
    counters = {}
    if users:
        rows = await session.execute(
            select(UsageCounter).where(
                UsageCounter.user_id.in_([u.id for u in users]),
                UsageCounter.month == month,
            )
        )
        counters = {row.user_id: row.count for row in rows.scalars().all()}

    items = [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "status": u.status,
            "email_verified": u.email_verified,
            "plan": u.plan.name if u.plan else None,
            "plan_id": u.plan_id,
            "requests_this_month": counters.get(u.id, 0),
            "created_at": _utc_iso(u.created_at),
        }
        for u in users
    ]
    return {"items": items, "total": total, "page": page, "pages": max(1, (total + page_size - 1) // page_size)}


@router.get("/v1/admin/users/active")
async def admin_active_users(
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = await session.execute(
        select(
            UsageLog.user_id,
            func.count(UsageLog.id).label("requests"),
            func.max(UsageLog.created_at).label("last_request"),
        )
        .where(UsageLog.created_at >= since)
        .group_by(UsageLog.user_id)
        .order_by(func.count(UsageLog.id).desc())
        .limit(100)
    )
    stats = rows.all()
    user_ids = [row.user_id for row in stats]
    users = {}
    if user_ids:
        result = await session.execute(
            select(User).options(selectinload(User.plan)).where(User.id.in_(user_ids))
        )
        users = {u.id: u for u in result.scalars().all()}
    items = []
    for row in stats:
        u = users.get(row.user_id)
        if u is None:
            continue
        items.append(
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "plan": u.plan.name if u.plan else None,
                "status": u.status,
                "requests": int(row.requests),
                "last_request": _utc_iso(row.last_request),
            }
        )
    return {"items": items, "days": days}


@router.get("/v1/admin/users/suspended")
async def admin_suspended_users(
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(User)
        .options(selectinload(User.plan))
        .where(User.status != "active")
        .order_by(User.id.desc())
    )
    users = result.scalars().all()
    return {
        "items": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "status": u.status,
                "plan": u.plan.name if u.plan else None,
                "created_at": _utc_iso(u.created_at),
            }
            for u in users
        ]
    }


@router.get("/v1/admin/users/{user_id}")
async def admin_user_detail(
    user_id: int,
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(User).options(selectinload(User.plan)).where(User.id == user_id)
    )
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    total_requests = (
        await session.execute(select(func.count(UsageLog.id)).where(UsageLog.user_id == user_id))
    ).scalar_one()
    error_requests = (
        await session.execute(
            select(func.count(UsageLog.id)).where(UsageLog.user_id == user_id, UsageLog.status != "success")
        )
    ).scalar_one()
    since = datetime.now(timezone.utc) - timedelta(days=30)
    last_30d = (
        await session.execute(
            select(func.count(UsageLog.id)).where(
                UsageLog.user_id == user_id, UsageLog.created_at >= since
            )
        )
    ).scalar_one()
    key_count = (
        await session.execute(
            select(func.count(ApiKey.id)).where(ApiKey.user_id == user_id, ApiKey.status == "active")
        )
    ).scalar_one()
    session_count = (
        await session.execute(
            select(func.count(UserSession.id)).where(
                UserSession.user_id == user_id, UserSession.revoked == False  # noqa: E712
            )
        )
    ).scalar_one()
    tx_result = await session.execute(
        select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.id.desc()).limit(5)
    )
    transactions = [
        {
            "id": tx.id,
            "amount": float(tx.amount),
            "currency": tx.currency,
            "method": tx.method,
            "status": tx.status,
            "ref": tx.ref,
            "created_at": _utc_iso(tx.created_at),
        }
        for tx in tx_result.scalars().all()
    ]
    log_result = await session.execute(
        select(UsageLog).where(UsageLog.user_id == user_id).order_by(UsageLog.id.desc()).limit(10)
    )
    recent_logs = [
        {
            "id": log.id,
            "platform": log.product,
            "url": log.url,
            "status": log.status,
            "created_at": _utc_iso(log.created_at),
        }
        for log in log_result.scalars().all()
    ]
    quota = await get_quota(user_id, session)

    return {
        "id": target.id,
        "email": target.email,
        "name": target.name,
        "role": target.role,
        "status": target.status,
        "email_verified": target.email_verified,
        "plan": target.plan.name if target.plan else None,
        "plan_id": target.plan_id,
        "google_id": bool(target.google_id),
        "created_at": _utc_iso(target.created_at),
        "stats": {
            "total_requests": int(total_requests),
            "error_requests": int(error_requests),
            "last_30d_requests": int(last_30d),
            "active_keys": int(key_count),
            "active_sessions": int(session_count),
        },
        "quota": quota,
        "transactions": transactions,
        "recent_logs": recent_logs,
    }


class UserStatusUpdate(BaseModel):
    status: str = Field(pattern="^(active|suspended)$")


@router.patch("/v1/admin/users/{user_id}/status")
async def admin_set_user_status(
    user_id: int,
    body: UserStatusUpdate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.id == admin.id and body.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot suspend your own account")
    target.status = body.status
    if body.status != "active":
        await session.execute(
            update(UserSession).where(UserSession.user_id == user_id).values(revoked=True)
        )
    await _admin_log(session, admin.id, f"user.{body.status}", str(user_id))
    await session.commit()
    return {"id": target.id, "status": target.status}


# --------------------------------------------------------------------- apis --

@router.get("/v1/admin/apis")
async def admin_list_apis(
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    since = datetime.now(timezone.utc) - timedelta(days=30)
    rows = await session.execute(
        select(
            UsageLog.product,
            func.count(UsageLog.id).label("requests"),
            func.coalesce(func.sum(case((UsageLog.status == "success", 0), else_=1)), 0).label("errors"),
        )
        .where(UsageLog.created_at >= since)
        .group_by(UsageLog.product)
    )
    usage = {row.product: (int(row.requests), int(row.errors)) for row in rows.all()}

    disabled = await get_settings_map(session, "platform.")

    items = []
    for slug in sorted(PLATFORM_ENGINES.keys()):
        req, err = usage.get(slug, (0, 0))
        items.append(
            {
                "product_id": None,
                "slug": slug,
                "name": slug.capitalize(),
                "source": "built-in",
                "active": str(disabled.get(f"platform.{slug}.enabled", "true")).lower() != "false",
                "price_monthly": None,
                "requests_30d": req,
                "errors_30d": err,
            }
        )

    result = await session.execute(select(ApiProduct).order_by(ApiProduct.id))
    for product in result.scalars().all():
        req, err = usage.get(product.slug, (0, 0))
        items.append(
            {
                "product_id": product.id,
                "slug": product.slug,
                "name": product.name,
                "source": "custom",
                "active": product.active,
                "price_monthly": float(product.price_monthly) if product.price_monthly is not None else None,
                "requests_30d": req,
                "errors_30d": err,
            }
        )
    return {"items": items}


class ApiProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=2, max_length=50)
    price_monthly: Optional[float] = Field(default=None, ge=0)


@router.post("/v1/admin/apis", status_code=status.HTTP_201_CREATED)
async def admin_create_api(
    body: ApiProductCreate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    slug = body.slug.strip().lower()
    if not _SLUG_RE.fullmatch(slug):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Slug must be lowercase letters, numbers and hyphens")
    if slug in PLATFORM_ENGINES:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That slug belongs to a built-in platform")
    result = await session.execute(select(ApiProduct).where(ApiProduct.slug == slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An API with that slug already exists")
    product = ApiProduct(name=body.name.strip(), slug=slug, price_monthly=body.price_monthly, active=True)
    session.add(product)
    await session.flush()
    await _admin_log(session, admin.id, "api.create", slug)
    await session.commit()
    return {"id": product.id, "slug": product.slug, "name": product.name, "active": True}


@router.patch("/v1/admin/apis/{product_id}/toggle")
async def admin_toggle_api(
    product_id: int,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(ApiProduct).where(ApiProduct.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API product not found")
    product.active = not product.active
    await _admin_log(session, admin.id, "api.toggle", product.slug)
    await session.commit()
    return {"id": product.id, "active": product.active}


@router.delete("/v1/admin/apis/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_api(
    product_id: int,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(ApiProduct).where(ApiProduct.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API product not found")
    await session.delete(product)
    await _admin_log(session, admin.id, "api.delete", product.slug)
    await session.commit()
    return None


_ENDPOINT_CONTRACT = [
    {"method": "POST", "path": "/v1/dlt/{platform}/info", "auth": "Bearer API key", "description": "Fetch metadata and available formats for a media URL."},
    {"method": "POST", "path": "/v1/dlt/{platform}/download", "auth": "Bearer API key", "description": "Download media. Body: url, format|quality|format_id."},
    {"method": "GET", "path": "/v1/dlt/files/{token}", "auth": "Public", "description": "Temporary download URL for a produced file. Expires after FILE_URL_TTL_SECONDS."},
    {"method": "GET", "path": "/v1/dlt/account/quota", "auth": "Bearer API key", "description": "Current plan, monthly limit, usage and reset time."},
    {"method": "GET", "path": "/v1/dlt/account/keys", "auth": "Bearer API key", "description": "List API keys for the authenticated account."},
    {"method": "POST", "path": "/v1/dlt/account/keys", "auth": "Bearer API key", "description": "Create a new API key (full key returned once)."},
    {"method": "DELETE", "path": "/v1/dlt/account/keys/{id}", "auth": "Bearer API key", "description": "Revoke an API key."},
    {"method": "GET", "path": "/v1/dlt/plans", "auth": "Public", "description": "List the available public plans."},
    {"method": "GET", "path": "/health", "auth": "Public", "description": "Liveness probe with service version and platform list."},
]


@router.get("/v1/admin/apis/endpoints")
async def admin_list_endpoints(user: User = Depends(_require_admin)):
    platforms = sorted(PLATFORM_ENGINES.keys())
    items = []
    for entry in _ENDPOINT_CONTRACT:
        if "{platform}" in entry["path"]:
            for platform in platforms:
                items.append({**entry, "path": entry["path"].replace("{platform}", platform), "platform": platform})
        else:
            items.append({**entry, "platform": None})
    return {"items": items, "platforms": platforms}


@router.get("/v1/admin/apis/monitoring")
async def admin_api_monitoring(
    days: int = Query(7, ge=1, le=90),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    total = (
        await session.execute(select(func.count(UsageLog.id)).where(UsageLog.created_at >= since))
    ).scalar_one()
    errors = (
        await session.execute(
            select(func.count(UsageLog.id)).where(
                UsageLog.created_at >= since, UsageLog.status != "success"
            )
        )
    ).scalar_one()

    rows = await session.execute(
        select(
            UsageLog.product,
            func.count(UsageLog.id).label("requests"),
            func.sum(case((UsageLog.status == "success", 0), else_=1)).label("errors"),
        )
        .where(UsageLog.created_at >= since)
        .group_by(UsageLog.product)
        .order_by(func.count(UsageLog.id).desc())
    )
    by_platform = [
        {
            "platform": row.product,
            "requests": int(row.requests),
            "errors": int(row.errors or 0),
            "success_rate": round((1 - int(row.errors or 0) / int(row.requests)) * 100, 1) if row.requests else 100.0,
        }
        for row in rows.all()
    ]

    day_rows = await session.execute(
        select(func.date(UsageLog.created_at).label("day"), func.count(UsageLog.id).label("requests"), func.sum(case((UsageLog.status == "success", 0), else_=1)).label("errors"))
        .where(UsageLog.created_at >= since)
        .group_by(func.date(UsageLog.created_at))
        .order_by(func.date(UsageLog.created_at))
    )
    series = [
        {"day": str(row.day), "requests": int(row.requests), "errors": int(row.errors or 0)}
        for row in day_rows.all()
    ]

    return {
        "days": days,
        "totals": {
            "requests": int(total),
            "errors": int(errors),
            "success_rate": round((1 - int(errors) / int(total)) * 100, 1) if total else 100.0,
        },
        "by_platform": by_platform,
        "series": series,
    }


_PLATFORM_TIMEOUT_DEFAULT = 600
_PLATFORM_RETRIES_DEFAULT = 1
_PLATFORM_RPM_DEFAULT = 0  # 0 = use gateway default


async def platform_config(session: AsyncSession, platform: str) -> dict:
    """Merged per-platform config stored in SystemSetting."""
    stored = await get_settings_map(session, f"platform.{platform}.")
    rpm = _parse_int(stored.get(f"platform.{platform}.requests_per_minute"), _PLATFORM_RPM_DEFAULT)
    return {
        "enabled": str(stored.get(f"platform.{platform}.enabled", "true")).lower() != "false",
        "timeout_seconds": max(10, min(_parse_int(stored.get(f"platform.{platform}.timeout_seconds"), _PLATFORM_TIMEOUT_DEFAULT), 3600)),
        "retries": max(1, min(_parse_int(stored.get(f"platform.{platform}.retries"), _PLATFORM_RETRIES_DEFAULT), 5)),
        "requests_per_minute": max(0, rpm),
    }


@router.get("/v1/admin/apis/config")
async def admin_get_api_config(
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    platforms = {}
    for slug in sorted(PLATFORM_ENGINES.keys()):
        platforms[slug] = await platform_config(session, slug)
    return {"platforms": platforms}


class PlatformConfigUpdate(BaseModel):
    platform: str = Field(min_length=2, max_length=50)
    enabled: Optional[bool] = None
    timeout_seconds: Optional[int] = Field(default=None, ge=10, le=3600)
    retries: Optional[int] = Field(default=None, ge=1, le=5)
    requests_per_minute: Optional[int] = Field(default=None, ge=0, le=100000)


@router.put("/v1/admin/apis/config")
async def admin_update_api_config(
    body: PlatformConfigUpdate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    platform = body.platform.strip().lower()
    if platform not in PLATFORM_ENGINES:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown platform")
    values = {}
    if body.enabled is not None:
        values[f"platform.{platform}.enabled"] = "true" if body.enabled else "false"
    if body.timeout_seconds is not None:
        values[f"platform.{platform}.timeout_seconds"] = str(body.timeout_seconds)
    if body.retries is not None:
        values[f"platform.{platform}.retries"] = str(body.retries)
    if body.requests_per_minute is not None:
        values[f"platform.{platform}.requests_per_minute"] = str(body.requests_per_minute)
    if not values:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update")
    await set_settings(session, values)
    await _admin_log(session, admin.id, "api.config", platform)
    await session.commit()
    return {"platform": platform, "config": await platform_config(session, platform)}


# ------------------------------------------------------------- transactions --

@router.get("/v1/admin/transactions")
async def admin_list_transactions(
    status_filter: str = Query("", alias="status"),
    method: str = "",
    search: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    query = select(Transaction, User.email).join(User, Transaction.user_id == User.id)
    count_query = select(func.count(Transaction.id)).join(User, Transaction.user_id == User.id)
    if status_filter.strip():
        query = query.where(Transaction.status == status_filter.strip())
        count_query = count_query.where(Transaction.status == status_filter.strip())
    if method.strip():
        query = query.where(Transaction.method == method.strip())
        count_query = count_query.where(Transaction.method == method.strip())
    if search.strip():
        needle = f"%{search.strip().lower()}%"
        clause = (
            func.lower(func.coalesce(Transaction.ref, "")).like(needle)
            | func.lower(User.email).like(needle)
        )
        query = query.where(clause)
        count_query = count_query.where(clause)

    total = (await session.execute(count_query)).scalar_one()
    result = await session.execute(
        query.order_by(Transaction.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = [
        {
            "id": tx.id,
            "user_id": tx.user_id,
            "user_email": email,
            "amount": float(tx.amount),
            "currency": tx.currency,
            "method": tx.method,
            "status": tx.status,
            "ref": tx.ref,
            "created_at": _utc_iso(tx.created_at),
        }
        for tx, email in result.all()
    ]

    summary_rows = await session.execute(
        select(
            func.coalesce(func.sum(Transaction.amount), 0).label("completed_sum"),
            func.count(Transaction.id).label("completed_count"),
        ).where(Transaction.status == "completed")
    )
    summary_row = summary_rows.one()
    pending_count = (
        await session.execute(
            select(func.count(Transaction.id)).where(Transaction.status == "pending")
        )
    ).scalar_one()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + page_size - 1) // page_size),
        "summary": {
            "completed_sum": float(summary_row.completed_sum or 0),
            "completed_count": int(summary_row.completed_count or 0),
            "pending_count": int(pending_count),
        },
    }


class TransactionStatusUpdate(BaseModel):
    status: str = Field(pattern="^(pending|completed|failed|refunded)$")


@router.patch("/v1/admin/transactions/{transaction_id}")
async def admin_update_transaction(
    transaction_id: int,
    body: TransactionStatusUpdate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Transaction).where(Transaction.id == transaction_id))
    tx = result.scalar_one_or_none()
    if tx is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    tx.status = body.status
    await _admin_log(session, admin.id, f"transaction.{body.status}", str(transaction_id))
    await session.commit()
    return {"id": tx.id, "status": tx.status}


# ------------------------------------------------------------------ invoices --

def _invoice_number(tx_id: int) -> str:
    return f"INV-{tx_id:06d}"


@router.get("/v1/admin/invoices")
async def admin_list_invoices(
    status_filter: str = Query("", alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    query = select(Transaction, User.email).join(User, Transaction.user_id == User.id)
    count_query = select(func.count(Transaction.id)).join(User, Transaction.user_id == User.id)
    if status_filter.strip() == "paid":
        query = query.where(Transaction.status == "completed")
        count_query = count_query.where(Transaction.status == "completed")
    elif status_filter.strip():
        query = query.where(Transaction.status == status_filter.strip())
        count_query = count_query.where(Transaction.status == status_filter.strip())

    total = (await session.execute(count_query)).scalar_one()
    result = await session.execute(
        query.order_by(Transaction.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = []
    for tx, email in result.all():
        items.append(
            {
                "id": tx.id,
                "invoice_number": _invoice_number(tx.id),
                "customer_email": email,
                "amount": float(tx.amount),
                "currency": tx.currency,
                "status": "paid" if tx.status == "completed" else tx.status,
                "method": tx.method,
                "issued_at": _utc_iso(tx.created_at),
            }
        )
    return {"items": items, "total": total, "page": page, "pages": max(1, (total + page_size - 1) // page_size)}


@router.get("/v1/admin/invoices/{transaction_id}")
async def admin_invoice_detail(
    transaction_id: int,
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(Transaction, User.email, User.name)
        .join(User, Transaction.user_id == User.id)
        .where(Transaction.id == transaction_id)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    tx, email, name = row
    amount = float(tx.amount)
    return {
        "id": tx.id,
        "invoice_number": _invoice_number(tx.id),
        "customer_email": email,
        "customer_name": name,
        "amount": amount,
        "currency": tx.currency,
        "status": "paid" if tx.status == "completed" else tx.status,
        "method": tx.method,
        "ref": tx.ref,
        "issued_at": _utc_iso(tx.created_at),
        "line_items": [
            {
                "description": f"API plan subscription ({tx.method})",
                "quantity": 1,
                "unit_price": amount,
                "amount": amount,
            }
        ],
    }


# ------------------------------------------------------------------ revenue --

@router.get("/v1/admin/revenue")
async def admin_revenue(
    months: int = Query(12, ge=1, le=36),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    now = datetime.now(timezone.utc)
    series = []
    for offset in range(months - 1, -1, -1):
        year = now.year
        month = now.month - offset
        while month <= 0:
            month += 12
            year -= 1
        start = datetime(year, month, 1, tzinfo=timezone.utc)
        end = datetime(year + (month == 12), 1 if month == 12 else month + 1, 1, tzinfo=timezone.utc)
        row = (
            await session.execute(
                select(
                    func.coalesce(func.sum(Transaction.amount), 0).label("revenue"),
                    func.count(Transaction.id).label("count"),
                ).where(
                    Transaction.status == "completed",
                    Transaction.created_at >= start,
                    Transaction.created_at < end,
                )
            )
        ).one()
        series.append(
            {
                "month": f"{year:04d}-{month:02d}",
                "revenue": float(row.revenue or 0),
                "transactions": int(row.count or 0),
            }
        )

    total_row = (
        await session.execute(
            select(
                func.coalesce(func.sum(Transaction.amount), 0).label("revenue"),
                func.count(Transaction.id).label("count"),
                func.coalesce(func.avg(Transaction.amount), 0).label("avg"),
            ).where(Transaction.status == "completed")
        )
    ).one()
    mrr = series[-1]["revenue"] if series else 0.0

    return {
        "mrr": mrr,
        "arr": mrr * 12,
        "total_revenue": float(total_row.revenue or 0),
        "total_transactions": int(total_row.count or 0),
        "avg_transaction": float(total_row.avg or 0),
        "series": series,
    }


# ------------------------------------------------------------- api request logs --

@router.get("/v1/admin/logs")
async def admin_api_logs(
    status_filter: str = Query("", alias="status"),
    platform: str = "",
    search: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    query = select(UsageLog, User.email).join(User, UsageLog.user_id == User.id)
    count_query = select(func.count(UsageLog.id)).join(User, UsageLog.user_id == User.id)
    if status_filter.strip():
        query = query.where(UsageLog.status == status_filter.strip())
        count_query = count_query.where(UsageLog.status == status_filter.strip())
    if platform.strip():
        query = query.where(UsageLog.product == platform.strip())
        count_query = count_query.where(UsageLog.product == platform.strip())
    if search.strip():
        needle = f"%{search.strip().lower()}%"
        clause = func.lower(func.coalesce(UsageLog.url, "")).like(needle) | func.lower(User.email).like(needle)
        query = query.where(clause)
        count_query = count_query.where(clause)

    total = (await session.execute(count_query)).scalar_one()
    result = await session.execute(
        query.order_by(UsageLog.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = [
        {
            "id": log.id,
            "user_email": email,
            "platform": log.product,
            "url": log.url,
            "status": log.status,
            "file_size": log.file_size,
            "created_at": _utc_iso(log.created_at),
        }
        for log, email in result.all()
    ]
    return {"items": items, "total": total, "page": page, "pages": max(1, (total + page_size - 1) // page_size)}


@router.get("/v1/admin/logs/errors")
async def admin_error_logs(
    platform: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    base = UsageLog.status != "success"
    count_query = select(func.count(UsageLog.id)).where(base)
    query = select(UsageLog, User.email).join(User, UsageLog.user_id == User.id).where(base)
    if platform.strip():
        query = query.where(UsageLog.product == platform.strip())
        count_query = count_query.where(UsageLog.product == platform.strip())

    total = (await session.execute(count_query)).scalar_one()
    result = await session.execute(
        query.order_by(UsageLog.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = [
        {
            "id": log.id,
            "user_email": email,
            "platform": log.product,
            "url": log.url,
            "status": log.status,
            "created_at": _utc_iso(log.created_at),
        }
        for log, email in result.all()
    ]

    grouped = await session.execute(
        select(UsageLog.product, func.count(UsageLog.id).label("count"), func.max(UsageLog.created_at).label("last_seen"))
        .where(base)
        .group_by(UsageLog.product)
        .order_by(func.count(UsageLog.id).desc())
    )
    by_platform = [
        {"platform": row.product, "count": int(row.count), "last_seen": _utc_iso(row.last_seen)}
        for row in grouped.all()
    ]

    return {
        "items": items,
        "by_platform": by_platform,
        "total": total,
        "page": page,
        "pages": max(1, (total + page_size - 1) // page_size),
    }


# ----------------------------------------------------------- support tickets --

def _ticket_admin_payload(ticket: SupportTicket, email: Optional[str] = None) -> dict:
    return {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "user_email": email,
        "subject": ticket.subject,
        "priority": ticket.priority,
        "status": ticket.status,
        "message_count": len(ticket.messages or []),
        "created_at": _utc_iso(ticket.created_at),
        "updated_at": _utc_iso(ticket.updated_at),
    }


@router.get("/v1/admin/support-tickets")
async def admin_list_tickets(
    status_filter: str = Query("", alias="status"),
    priority: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    query = select(SupportTicket)
    count_query = select(func.count(SupportTicket.id))
    if status_filter.strip():
        query = query.where(SupportTicket.status == status_filter.strip())
        count_query = count_query.where(SupportTicket.status == status_filter.strip())
    if priority.strip():
        query = query.where(SupportTicket.priority == priority.strip())
        count_query = count_query.where(SupportTicket.priority == priority.strip())
    total = (await session.execute(count_query)).scalar_one()
    result = await session.execute(
        query.order_by(SupportTicket.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    tickets = result.scalars().all()
    user_ids = {ticket.user_id for ticket in tickets}
    users = {}
    if user_ids:
        rows = await session.execute(select(User.id, User.email).where(User.id.in_(user_ids)))
        users = dict(rows.all())
    items = [_ticket_admin_payload(ticket, users.get(ticket.user_id)) for ticket in tickets]
    return {"items": items, "total": total, "page": page, "pages": max(1, (total + page_size - 1) // page_size)}


@router.get("/v1/admin/support-tickets/{ticket_id}")
async def admin_get_ticket(
    ticket_id: int,
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    owner = await session.execute(select(User.email, User.name).where(User.id == ticket.user_id))
    owner_row = owner.first()
    payload = _ticket_admin_payload(ticket, owner_row[0] if owner_row else None)
    payload["customer_name"] = owner_row[1] if owner_row else None
    payload["messages"] = [
        {
            "id": message.id,
            "author": message.author,
            "body": message.body,
            "created_at": _utc_iso(message.created_at),
        }
        for message in (ticket.messages or [])
    ]
    return payload


class AdminTicketReply(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


@router.post("/v1/admin/support-tickets/{ticket_id}/replies", status_code=status.HTTP_201_CREATED)
async def admin_reply_ticket(
    ticket_id: int,
    body: AdminTicketReply,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    message = TicketMessage(ticket_id=ticket.id, author="admin", body=body.body.strip())
    session.add(message)
    ticket.status = "pending"
    ticket.updated_at = datetime.now(timezone.utc)
    await session.commit()
    return {"id": message.id, "author": message.author, "body": message.body, "created_at": _utc_iso(message.created_at)}


class AdminTicketStatusUpdate(BaseModel):
    status: str = Field(pattern="^(open|pending|closed)$")


@router.patch("/v1/admin/support-tickets/{ticket_id}")
async def admin_update_ticket_status(
    ticket_id: int,
    body: AdminTicketStatusUpdate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    ticket.status = body.status
    ticket.updated_at = datetime.now(timezone.utc)
    await _admin_log(session, admin.id, f"ticket.{body.status}", str(ticket_id))
    await session.commit()
    return {"id": ticket.id, "status": ticket.status}


# --------------------------------------------------------------- announcements --

@router.get("/v1/admin/announcements")
async def admin_list_announcements(
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Announcement).order_by(Announcement.id.desc()).limit(100))
    return {
        "items": [
            {
                "id": item.id,
                "title": item.title,
                "body": item.body,
                "audience": item.audience,
                "sent_count": item.sent_count,
                "created_at": _utc_iso(item.created_at),
            }
            for item in result.scalars().all()
        ]
    }


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    body: str = Field(min_length=3, max_length=5000)
    audience: str = Field(default="all", pattern="^(all|admins|users)$")


@router.post("/v1/admin/announcements", status_code=status.HTTP_201_CREATED)
async def admin_create_announcement(
    body: AnnouncementCreate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    query = select(User.id).where(User.status == "active")
    if body.audience == "admins":
        query = query.where(User.role == "admin")
    elif body.audience == "users":
        query = query.where(User.role == "user")
    recipients = [row[0] for row in (await session.execute(query)).all()]

    announcement = Announcement(
        title=body.title.strip(),
        body=body.body.strip(),
        audience=body.audience,
        sent_count=len(recipients),
        created_by=admin.id,
    )
    session.add(announcement)
    for user_id in recipients:
        session.add(
            Notification(user_id=user_id, title=announcement.title, body=announcement.body, type="announcement")
        )
    await _admin_log(session, admin.id, "announcement.publish", body.audience)
    await session.commit()
    await session.refresh(announcement)
    return {
        "id": announcement.id,
        "title": announcement.title,
        "audience": announcement.audience,
        "sent_count": announcement.sent_count,
        "created_at": _utc_iso(announcement.created_at),
    }


@router.delete("/v1/admin/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_announcement(
    announcement_id: int,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Announcement).where(Announcement.id == announcement_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    await session.delete(item)
    await _admin_log(session, admin.id, "announcement.delete", str(announcement_id))
    await session.commit()
    return None


# ------------------------------------------------------------ notification log --

@router.get("/v1/admin/notifications")
async def admin_list_notifications(
    type_filter: str = Query("", alias="type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    query = select(Notification, User.email).join(User, Notification.user_id == User.id)
    count_query = select(func.count(Notification.id)).join(User, Notification.user_id == User.id)
    if type_filter.strip():
        query = query.where(Notification.type == type_filter.strip())
        count_query = count_query.where(Notification.type == type_filter.strip())
    total = (await session.execute(count_query)).scalar_one()
    result = await session.execute(
        query.order_by(Notification.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    items = [
        {
            "id": row.id,
            "user_email": email,
            "title": row.title,
            "body": row.body,
            "type": row.type,
            "read": row.read,
            "created_at": _utc_iso(row.created_at),
        }
        for row, email in result.all()
    ]
    return {"items": items, "total": total, "page": page, "pages": max(1, (total + page_size - 1) // page_size)}


# ----------------------------------------------------------------------- faq --

def _faq_payload(item: FaqItem) -> dict:
    return {
        "id": item.id,
        "question": item.question,
        "answer": item.answer,
        "category": item.category,
        "position": item.position,
        "published": item.published,
        "updated_at": _utc_iso(item.updated_at),
        "created_at": _utc_iso(item.created_at),
    }


@router.get("/v1/admin/faq")
async def admin_list_faq(user: User = Depends(_require_admin), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(FaqItem).order_by(FaqItem.position, FaqItem.id))
    return {"items": [_faq_payload(item) for item in result.scalars().all()]}


class FaqIngest(BaseModel):
    question: str = Field(min_length=5, max_length=500)
    answer: str = Field(min_length=1, max_length=5000)
    category: str = Field(default="General", max_length=100)
    position: int = Field(default=0, ge=0, le=10000)
    published: bool = True


@router.post("/v1/admin/faq", status_code=status.HTTP_201_CREATED)
async def admin_create_faq(
    body: FaqIngest,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    item = FaqItem(
        question=body.question.strip(),
        answer=body.answer.strip(),
        category=(body.category or "General").strip() or "General",
        position=body.position,
        published=body.published,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return _faq_payload(item)


class FaqUpdate(BaseModel):
    question: Optional[str] = Field(default=None, min_length=5, max_length=500)
    answer: Optional[str] = Field(default=None, min_length=1, max_length=5000)
    category: Optional[str] = Field(default=None, max_length=100)
    position: Optional[int] = Field(default=None, ge=0, le=10000)
    published: Optional[bool] = None


@router.put("/v1/admin/faq/{faq_id}")
async def admin_update_faq(
    faq_id: int,
    body: FaqUpdate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(FaqItem).where(FaqItem.id == faq_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ item not found")
    if body.question is not None:
        item.question = body.question.strip()
    if body.answer is not None:
        item.answer = body.answer.strip()
    if body.category is not None:
        item.category = body.category.strip() or "General"
    if body.position is not None:
        item.position = body.position
    if body.published is not None:
        item.published = body.published
    await session.commit()
    await session.refresh(item)
    return _faq_payload(item)


@router.delete("/v1/admin/faq/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_faq(
    faq_id: int,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(FaqItem).where(FaqItem.id == faq_id))
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ item not found")
    await session.delete(item)
    await session.commit()
    return None


# ---------------------------------------------------------------------- docs --

def _doc_payload(doc: DocPage, include_body: bool = False) -> dict:
    payload = {
        "id": doc.id,
        "title": doc.title,
        "section": doc.section,
        "slug": doc.slug,
        "status": doc.status,
        "updated_at": _utc_iso(doc.updated_at),
        "created_at": _utc_iso(doc.created_at),
    }
    if include_body:
        payload["body"] = doc.body
    return payload


@router.get("/v1/admin/docs")
async def admin_list_docs(user: User = Depends(_require_admin), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(DocPage).order_by(DocPage.section, DocPage.title))
    return {"items": [_doc_payload(doc) for doc in result.scalars().all()]}


@router.get("/v1/admin/docs/{doc_id}")
async def admin_get_doc(
    doc_id: int,
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(DocPage).where(DocPage.id == doc_id))
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return _doc_payload(doc, include_body=True)


class DocIngest(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    section: str = Field(default="Guides", max_length=100)
    slug: str = Field(min_length=2, max_length=255)
    body: str = Field(default="", max_length=50000)
    status: str = Field(default="draft", pattern="^(draft|published)$")


@router.post("/v1/admin/docs", status_code=status.HTTP_201_CREATED)
async def admin_create_doc(
    body: DocIngest,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    slug = body.slug.strip().lower()
    if not _SLUG_RE.fullmatch(slug):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Slug must be lowercase letters, numbers and hyphens")
    result = await session.execute(select(DocPage).where(DocPage.slug == slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A document with that slug already exists")
    doc = DocPage(
        title=body.title.strip(),
        section=(body.section or "Guides").strip() or "Guides",
        slug=slug,
        body=body.body,
        status=body.status,
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return _doc_payload(doc, include_body=True)


class DocUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    section: Optional[str] = Field(default=None, max_length=100)
    slug: Optional[str] = Field(default=None, min_length=2, max_length=255)
    body: Optional[str] = Field(default=None, max_length=50000)
    status: Optional[str] = Field(default=None, pattern="^(draft|published)$")


@router.put("/v1/admin/docs/{doc_id}")
async def admin_update_doc(
    doc_id: int,
    body: DocUpdate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(DocPage).where(DocPage.id == doc_id))
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if body.title is not None:
        doc.title = body.title.strip()
    if body.section is not None:
        doc.section = body.section.strip() or "Guides"
    if body.slug is not None:
        slug = body.slug.strip().lower()
        if not _SLUG_RE.fullmatch(slug):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Slug must be lowercase letters, numbers and hyphens")
        if slug != doc.slug:
            clash = await session.execute(select(DocPage).where(DocPage.slug == slug))
            if clash.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A document with that slug already exists")
        doc.slug = slug
    if body.body is not None:
        doc.body = body.body
    if body.status is not None:
        doc.status = body.status
    await session.commit()
    await session.refresh(doc)
    return _doc_payload(doc, include_body=True)


@router.delete("/v1/admin/docs/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_doc(
    doc_id: int,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(DocPage).where(DocPage.id == doc_id))
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    await session.delete(doc)
    await session.commit()
    return None


# ------------------------------------------------------------- site settings --

_SITE_GROUPS: Dict[str, Dict[str, Any]] = {
    "general": {
        "platform_name": "DLT API Platform",
        "support_email": "support@example.com",
        "timezone": "UTC",
        "locale": "en-US",
    },
    "branding": {
        "brand_name": "DELETE API",
        "primary_color": "#06b6d4",
        "accent_color": "#4f46e5",
    },
    "seo": {
        "meta_title": "DELETE API — Download APIs",
        "meta_description": "Professional download APIs for YouTube, Instagram, Facebook and TikTok.",
        "canonical_url": "https://dltapi.cc.cd",
    },
    "homepage": {
        "hero_title": "Download APIs for every platform",
        "hero_subtitle": "One consistent API for YouTube, Instagram, Facebook and TikTok.",
        "hero_primary_cta_label": "Get API access",
        "hero_primary_cta_href": "/register",
        "hero_secondary_cta_label": "Read the docs",
        "hero_secondary_cta_href": "/documentation",
    },
    "security": {
        "two_factor_enforced": "false",
        "session_timeout_hours": "168",
        "ip_allowlist": "",
    },
    "system": {
        "maintenance_enabled": "false",
        "maintenance_message": "We are performing scheduled maintenance. Please try again shortly.",
        "signup_enabled": "true",
    },
}

_SITE_KEY_PREFIX = {
    "security": "security.",
    "system": "system.",
}


def _site_key(group: str, key: str) -> str:
    prefix = _SITE_KEY_PREFIX.get(group, f"site.{group}.")
    return f"{prefix}{key}"


@router.get("/v1/admin/site/{group}")
async def admin_get_site_group(
    group: str,
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    defaults = _SITE_GROUPS.get(group)
    if defaults is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown settings group")
    values = {}
    for key, default in defaults.items():
        stored = await get_setting(session, _site_key(group, key))
        values[key] = stored if stored is not None else default
    return {"group": group, "values": values}


@router.put("/v1/admin/site/{group}")
async def admin_put_site_group(
    group: str,
    body: Dict[str, Any],
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    defaults = _SITE_GROUPS.get(group)
    if defaults is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown settings group")
    if not isinstance(body, dict):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Expected a JSON object")
    values = {}
    for key, value in body.items():
        if key not in defaults:
            continue
        if isinstance(value, bool):
            value = "true" if value else "false"
        values[_site_key(group, key)] = str(value)
    if not values:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No recognised settings in payload")
    await set_settings(session, values)
    await _admin_log(session, admin.id, f"site.{group}.update", ",".join(sorted(values)))
    await session.commit()
    return await admin_get_site_group(group, user, session)


@router.get("/v1/public/site")
async def public_site_settings(session: AsyncSession = Depends(get_session)):
    async def group(name: str) -> dict:
        defaults = _SITE_GROUPS[name]
        values = {}
        for key, default in defaults.items():
            stored = await get_setting(session, _site_key(name, key))
            values[key] = stored if stored is not None else default
        return values

    system = await group("system")
    return {
        "general": await group("general"),
        "branding": await group("branding"),
        "seo": await group("seo"),
        "homepage": await group("homepage"),
        "maintenance": {
            "enabled": _parse_bool(system.get("maintenance_enabled")),
            "message": system.get("maintenance_message") or "",
        },
    }


@router.get("/v1/public/maintenance")
async def public_maintenance(session: AsyncSession = Depends(get_session)):
    enabled = await get_setting(session, "system.maintenance_enabled", "false")
    message = await get_setting(session, "system.maintenance_message", "")
    return {"enabled": _parse_bool(enabled), "message": message}


async def maintenance_config() -> dict:
    """Used by the middleware in main.py (cached briefly there)."""
    async with AsyncSessionLocal() as session:
        enabled = await get_setting(session, "system.maintenance_enabled", "false")
        message = await get_setting(session, "system.maintenance_message", "")
    return {"enabled": _parse_bool(enabled), "message": message}


async def signup_enabled() -> bool:
    async with AsyncSessionLocal() as session:
        value = await get_setting(session, "system.signup_enabled", "true")
    return _parse_bool(value, True)


# -------------------------------------------------------------- rate limits --

_RATE_DEFAULTS = {"info_per_minute": 30, "download_per_minute": 10}


@router.get("/v1/admin/rate-limits")
async def admin_get_rate_limits(
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    info = _parse_int(await get_setting(session, "ratelimit.info_per_minute"), _RATE_DEFAULTS["info_per_minute"])
    download = _parse_int(await get_setting(session, "ratelimit.download_per_minute"), _RATE_DEFAULTS["download_per_minute"])
    result = await session.execute(select(Plan).order_by(Plan.id))
    plans = []
    for plan in result.scalars().all():
        override = await get_setting(session, f"ratelimit.plan.{plan.id}.per_minute")
        plans.append({"id": plan.id, "name": plan.name, "per_minute": _parse_int(override, 0) if override is not None else None})
    return {
        "info_per_minute": info,
        "download_per_minute": download,
        "defaults": _RATE_DEFAULTS,
        "plans": plans,
    }


class RateLimitUpdate(BaseModel):
    info_per_minute: Optional[int] = Field(default=None, ge=1, le=100000)
    download_per_minute: Optional[int] = Field(default=None, ge=1, le=100000)


@router.put("/v1/admin/rate-limits")
async def admin_put_rate_limits(
    body: RateLimitUpdate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    values = {}
    if body.info_per_minute is not None:
        values["ratelimit.info_per_minute"] = str(body.info_per_minute)
    if body.download_per_minute is not None:
        values["ratelimit.download_per_minute"] = str(body.download_per_minute)
    if not values:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nothing to update")
    await set_settings(session, values)
    await _admin_log(session, admin.id, "ratelimit.update", ",".join(sorted(values)))
    await session.commit()
    return await admin_get_rate_limits(admin, session)


class PlanRateLimitUpdate(BaseModel):
    per_minute: Optional[int] = Field(default=None, ge=1, le=100000)


@router.put("/v1/admin/rate-limits/plans/{plan_id}")
async def admin_put_plan_rate_limit(
    plan_id: int,
    body: PlanRateLimitUpdate,
    admin: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    key = f"ratelimit.plan.{plan.id}.per_minute"
    if body.per_minute is None:
        existing = await session.execute(select(SystemSetting).where(SystemSetting.key == key))
        row = existing.scalar_one_or_none()
        if row is not None:
            await session.delete(row)
            await session.commit()
    else:
        await set_settings(session, {key: str(body.per_minute)})
    await _admin_log(session, admin.id, "ratelimit.plan.update", str(plan_id))
    await session.commit()
    return {"id": plan.id, "per_minute": body.per_minute}


async def gateway_rate_limit(session: AsyncSession, user: Optional[User], kind: str, default: int) -> int:
    """Gateway-wide per-minute limit, tightened by plan override if set."""
    limit = _parse_int(await get_setting(session, f"ratelimit.{kind}_per_minute"), default)
    if user is not None and user.plan_id is not None:
        override = await get_setting(session, f"ratelimit.plan.{user.plan_id}.per_minute")
        override_int = _parse_int(override, 0)
        if override_int > 0:
            limit = min(limit, override_int)
    return limit


# ----------------------------------------------------------- server monitoring --

def _dir_size_bytes(path: Path) -> int:
    total = 0
    try:
        for entry in path.rglob("*"):
            try:
                if entry.is_file():
                    total += entry.stat().st_size
            except OSError:
                continue
    except OSError:
        return 0
    return total


@router.get("/v1/admin/monitoring/server")
async def admin_server_monitoring(
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    try:
        disk = shutil.disk_usage(DOWNLOAD_DIR)
        disk_payload = {
            "total_mb": disk.total // (1024 * 1024),
            "used_mb": disk.used // (1024 * 1024),
            "free_mb": disk.free // (1024 * 1024),
        }
    except OSError:
        disk_payload = None

    download_bytes = await asyncio.to_thread(_dir_size_bytes, DOWNLOAD_DIR)
    try:
        files_count = sum(1 for entry in DOWNLOAD_DIR.iterdir() if entry.is_file())
    except OSError:
        files_count = 0
    token_dir = DOWNLOAD_DIR / ".tokens"
    try:
        tokens_count = sum(1 for entry in token_dir.glob("*.json")) if token_dir.exists() else 0
    except OSError:
        tokens_count = 0

    memory_payload = None
    try:
        info = {}
        with open("/proc/meminfo", "r", encoding="utf-8") as handle:
            for line in handle:
                parts = line.split()
                if len(parts) >= 2:
                    info[parts[0].rstrip(":")] = int(parts[1])  # kB
        total_kb = info.get("MemTotal")
        available_kb = info.get("MemAvailable")
        if total_kb and available_kb:
            memory_payload = {
                "total_mb": total_kb // 1024,
                "available_mb": available_kb // 1024,
                "used_mb": (total_kb - available_kb) // 1024,
            }
    except OSError:
        memory_payload = None

    try:
        load_avg = list(os.getloadavg())
    except OSError:
        load_avg = None

    redis_status = "unconfigured"
    try:
        import redis.asyncio as aioredis

        client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        try:
            await asyncio.wait_for(client.ping(), timeout=1.5)
            redis_status = "up"
        except Exception:
            redis_status = "down"
        finally:
            await client.aclose()
    except Exception:
        redis_status = "unconfigured"

    return {
        "app": {
            "version": settings.APP_VERSION,
            "python": sys.version.split()[0],
            "platform": sys.platform,
            "uptime_seconds": int(time.time() - _STARTED_AT),
        },
        "disk": disk_payload,
        "downloads": {
            "directory": str(DOWNLOAD_DIR),
            "size_mb": download_bytes // (1024 * 1024),
            "files": files_count,
            "active_tokens": tokens_count,
        },
        "memory": memory_payload,
        "load_avg": load_avg,
        "redis": redis_status,
    }


# ------------------------------------------------------------ admin overview extra --

@router.get("/v1/admin/security/overview")
async def admin_security_overview(
    user: User = Depends(_require_admin),
    session: AsyncSession = Depends(get_session),
):
    total_users = (await session.execute(select(func.count(User.id)))).scalar_one()
    totp_users = (
        await session.execute(
            select(func.count(UserSetting.user_id)).where(
                UserSetting.key == "security.totp_enabled",
                UserSetting.value == "true",
            )
        )
    ).scalar_one()
    active_sessions = (
        await session.execute(
            select(func.count(UserSession.id)).where(UserSession.revoked == False)  # noqa: E712
        )
    ).scalar_one()
    verified = (
        await session.execute(select(func.count(User.id)).where(User.email_verified == True))  # noqa: E712
    ).scalar_one()
    return {
        "total_users": int(total_users),
        "two_factor_users": int(totp_users),
        "two_factor_coverage": round((totp_users / total_users) * 100, 1) if total_users else 0.0,
        "active_sessions": int(active_sessions),
        "verified_users": int(verified),
    }
