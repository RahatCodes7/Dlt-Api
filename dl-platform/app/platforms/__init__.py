from typing import Optional

from sqlalchemy import select

from app.database import get_session
from app.models import Proxy
from app.platforms.base import PlatformEngine, YtDlpEngine
from app.platforms.facebook import engine as facebook_engine
from app.platforms.instagram import engine as instagram_engine
from app.proxies import get_rotator
from app.platforms.tiktok import engine as tiktok_engine
from app.platforms.youtube import engine as youtube_engine


async def build_platform_engines(session) -> dict:
    """Build platform engines with proxy rotators injected from DB."""
    engines: dict = {
        "youtube": youtube_engine,
        "instagram": instagram_engine,
        "facebook": facebook_engine,
        "tiktok": tiktok_engine,
    }

    for platform_name, engine in engines.items():
        result = await session.execute(
            select(Proxy).where(
                (Proxy.platform == platform_name) | (Proxy.platform.is_(None)),
                Proxy.status == "active",
            )
        )
        proxies = list(result.scalars().all())

        rotator = get_rotator(platform_name, proxies)
        engine.proxy_rotator = rotator

    return engines


# Default engines (without DB session - used at import time)
PLATFORM_ENGINES: dict = {
    "youtube": youtube_engine,
    "instagram": instagram_engine,
    "facebook": facebook_engine,
    "tiktok": tiktok_engine,
}


def get_engine(platform: str) -> Optional[PlatformEngine]:
    return PLATFORM_ENGINES.get(platform)


__all__ = [
    "PlatformEngine",
    "YtDlpEngine",
    "get_engine",
    "PLATFORM_ENGINES",
    "build_platform_engines",
    "facebook_engine",
    "instagram_engine",
    "tiktok_engine",
    "youtube_engine",
]
