from typing import Optional

from app.platforms.base import PlatformEngine, YtDlpEngine
from app.platforms.facebook import engine as facebook_engine
from app.platforms.instagram import engine as instagram_engine
from app.platforms.tiktok import engine as tiktok_engine
from app.platforms.youtube import engine as youtube_engine

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
    "facebook_engine",
    "instagram_engine",
    "tiktok_engine",
    "youtube_engine",
]
