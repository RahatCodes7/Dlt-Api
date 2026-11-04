import json
from datetime import datetime, timezone
from typing import Optional

import redis.asyncio as redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.models import User, UsageCounter


redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis_client


def month_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


async def rate_limit_check(key: str, limit: int, window_seconds: int = 60) -> bool:
    """Return True if allowed, False if rate limited."""
    r = await get_redis()
    current = await r.get(key)
    if current is None:
        await r.set(key, "1", ex=window_seconds)
        return True
    if int(current) >= limit:
        return False
    await r.incr(key)
    return True


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
    limit = user.plan.monthly_requests if user and user.plan else 0

    return {
        "user_id": user_id,
        "month": month,
        "limit": limit,
        "used": used,
        "remaining": max(limit - used, 0),
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
