from app.platforms.base import YtDlpEngine

URL_PATTERNS = [
    r"(?:https?://)?(?:www\.)?tiktok\.com/@[\w.-]+/video/\d+",
    r"(?:https?://)?(?:www\.)?tiktok\.com/t/[\w-]+",
    r"(?:https?://)?(?:www\.)?tiktok\.com/.+",
    r"(?:https?://)?(?:www\.)?vm\.tiktok\.com/[\w-]+",
]

engine = YtDlpEngine(platform="tiktok", url_patterns=URL_PATTERNS)

__all__ = ["engine", "URL_PATTERNS"]
