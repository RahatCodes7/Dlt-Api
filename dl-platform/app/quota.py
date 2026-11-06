import asyncio
import time
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.models import User, UsageCounter


redis_client: Optional[redis.Redis] = None
redis_disabled_until: float = 0.0

# In-memory fallback so the API keeps working when Redis is unavailable.
_memory_buckets: dict[str, tuple[int, float]] = {}
_memory_lock = asyncio.Lock()


async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


def month_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def month_reset_at(now: Optional[datetime] = None) -> datetime:
    """First instant of the next UTC month, when the usage counter resets."""
    now = now or datetime.now(timezone.utc)
    if now.month == 12:
        return now.replace(
            year=now.year + 1,
            month=1,
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )
    return now.replace(
        month=now.month + 1,
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )


async def _memory_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    now = time.monotonic()
    async with _memory_lock:
        count, reset_at = _memory_buckets.get(key, (0, now + window_seconds))
        if now >= reset_at:
            count, reset_at = 0, now + window_seconds
        if count >= limit:
            _memory_buckets[key] = (count, reset_at)
            return False
        _memory_buckets[key] = (count + 1, reset_at)
        return True


async def rate_limit_check(key: str, limit: int, window_seconds: int = 60) -> bool:
    """Return True if allowed, False if rate limited.

    Uses Redis when available and falls back to a process-local limiter so the
    API remains usable when Redis is down or not configured (local dev).
    """
    global redis_disabled_until

    if time.monotonic() >= redis_disabled_until:
        try:
            r = await get_redis()
            current = await r.get(key)
            if current is None:
                await r.set(key, "1", ex=window_seconds)
                return True
            if int(current) >= limit:
                return False
            await r.incr(key)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[rate-limit] Redis unavailable, using memory fallback: {exc}")
            redis_disabled_until = time.monotonic() + 30

    return await _memory_rate_limit(key, limit, window_seconds)


async def get_quota(user_id: int, session: AsyncSession) -> dict:
    month = month_key()
    result = await session.execute(
        select(UsageCounter).where(
            UsageCounter.user_id == user_id, UsageCounter.month == month
        )
    )
    counter = result.scalar_one_or_none()
    used = counter.count if counter else 0

    # plan limit
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one()
    plan_name = user.plan.name if user and user.plan else None
    limit = user.plan.monthly_requests if user and user.plan else 0
    reset_at = month_reset_at()

    return {
        "plan": plan_name,
        "user_id": user_id,
        "month": month,
        "limit": limit,
        "used": used,
        "remaining": max(limit - used, 0),
        "reset_at": reset_at,
        "resets_at": reset_at,
    }


async def increment_usage(user_id: int, session: AsyncSession) -> None:
    month = month_key()
    result = await session.execute(
        select(UsageCounter).where(
            UsageCounter.user_id == user_id, UsageCounter.month == month
        )
    )
    counter = result.scalar_one_or_none()
    if counter is None:
        counter = UsageCounter(user_id=user_id, month=month, count=1)
        session.add(counter)
    else:
        counter.count += 1
    await session.commit()
