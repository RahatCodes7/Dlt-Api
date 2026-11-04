import secrets
from datetime import datetime, timezone
from hashlib import sha256
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.models import ApiKey, User


security = HTTPBearer(auto_error=False)


def hash_api_key(key: str) -> str:
    return sha256(key.encode("utf-8")).hexdigest()


def generate_api_key() -> str:
    raw = f"{settings.API_KEY_PREFIX}_{secrets.token_urlsafe(settings.API_KEY_LENGTH)}"
    return raw


def datetime_now() -> datetime:
    return datetime.now(timezone.utc)


async def get_api_key_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    session: AsyncSession = Depends(get_session),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    key = credentials.credentials
    key_hash = hash_api_key(key)

    result = await session.execute(
        select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.status == "active")
    )
    api_key = result.scalar_one_or_none()

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # load user
    result = await session.execute(select(User).where(User.id == api_key.user_id))
    user = result.scalar_one_or_none()
    if user is None or user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account inactive",
        )

    # mark last used
    api_key.last_used = datetime_now()
    await session.commit()

    return user


def require_platform(platform: str):
    async def _check(user: User = Depends(get_api_key_user)) -> User:
        # platform access resolved against api_keys.platforms or subscription; MVP: allow all
        return user

    return _check
