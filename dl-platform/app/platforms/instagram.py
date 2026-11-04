from app.platforms.base import YtDlpEngine

URL_PATTERNS = [
    r"(?:https?://)?(?:www\.)?instagram\.com/(?:p|reel|reels|tv|stories)/[\w-]+",
    r"(?:https?://)?(?:www\.)?instagr\.am/p/[\w-]+",
]

engine = YtDlpEngine(platform="instagram", url_patterns=URL_PATTERNS)

__all__ = ["engine", "URL_PATTERNS"]
