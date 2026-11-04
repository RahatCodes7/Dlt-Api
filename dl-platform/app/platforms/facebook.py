from app.platforms.base import YtDlpEngine

URL_PATTERNS = [
    r"(?:https?://)?(?:www\.)?facebook\.com/(?:[^/]+/)?(?:videos?|watch|reel|story|reels|share)/[\w-]+",
    r"(?:https?://)?(?:www\.)?fb\.watch/[\w-]+",
    r"(?:https?://)?(?:m\.)?facebook\.com/.*\b(?:video|reel|story|share)\b",
    r"(?:https?://)?(?:www\.)?facebook\.com/share/v/[\w-]+",
]

engine = YtDlpEngine(platform="facebook", url_patterns=URL_PATTERNS)

__all__ = ["engine", "URL_PATTERNS"]
