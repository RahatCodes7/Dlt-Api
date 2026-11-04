from app.platforms.base import YtDlpEngine

URL_PATTERNS = [
    r"(?:https?://)?(?:www\.)?(?:youtube\.com|youtu\.be)/.+",
]

engine = YtDlpEngine(platform="youtube", url_patterns=URL_PATTERNS)

__all__ = ["engine", "URL_PATTERNS"]
