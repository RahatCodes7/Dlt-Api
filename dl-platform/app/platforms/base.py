import asyncio
import logging
import os
import re
import tempfile
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import yt_dlp

log = logging.getLogger("dlt.platform")

DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)


class PlatformEngine(ABC):
    """Base platform engine using yt-dlp."""

    platform: str = "base"
    url_patterns: list = []

    def matches(self, url: str) -> bool:
        return any(re.search(p, url, re.IGNORECASE) for p in self.url_patterns)

    @abstractmethod
    async def extract_info(self, url: str) -> Tuple[Optional[dict], Optional[str]]:
        """Return (info_dict, error)."""

    @abstractmethod
    async def download(self, url: str, format_id: Optional[str] = None) -> Tuple[Optional[str], Optional[dict], Optional[str]]:
        """Return (file_path, info_dict, error)."""


class YtDlpEngine(PlatformEngine):
    """yt-dlp backed engine shared across platforms."""

    def __init__(self, platform: str, url_patterns: list, timeout: int = 60):
        self.platform = platform
        self.url_patterns = url_patterns
        self.timeout = timeout

    def matches(self, url: str) -> bool:
        return any(re.search(p, url, re.IGNORECASE) for p in self.url_patterns)

    def _ydl_opts(self, download: bool = False, format_id: Optional[str] = None) -> dict:
        opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
            "socket_timeout": 30,
            "retries": 2,
            "fragment_retries": 2,
            "extractor_retries": 2,
            "skip_download": not download,
        }
        if download:
            opts["outtmpl"] = os.path.join(tempfile.gettempdir(), "dlt_%(id)s.%(ext)s")
            if format_id:
                opts["format"] = format_id
            else:
                opts["format"] = "bestvideo+bestaudio/best"
        return opts

    def _run_extract_info(self, url: str) -> Tuple[Optional[dict], Optional[str]]:
        try:
            with yt_dlp.YoutubeDL(self._ydl_opts(download=False)) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info:
                    return None, "Could not extract video info"
                return info, None
        except Exception as exc:  # noqa: BLE001
            log.exception("yt-dlp extract_info failed for %s", url)
            return None, str(exc)

    def _run_download(self, url: str, format_id: Optional[str] = None) -> Tuple[Optional[str], Optional[dict], Optional[str]]:
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                opts = self._ydl_opts(download=True, format_id=format_id)
                opts["outtmpl"] = os.path.join(tmpdir, "video.%(ext)s")
                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    if not info:
                        return None, None, "Could not extract video info"
                    for fname in os.listdir(tmpdir):
                        fpath = os.path.join(tmpdir, fname)
                        if os.path.isfile(fpath):
                            ext = os.path.splitext(fname)[1]
                            safe_title = re.sub(r"[^\w\-_\.]", "_", info.get("title", "video"))[:50]
                            permanent = DOWNLOAD_DIR / f"{safe_title}_{self.platform}{ext}"
                            os.replace(fpath, permanent)
                            return str(permanent), info, None
                    return None, info, "No file downloaded"
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            log.exception("yt-dlp download failed for %s", url)
            return None, None, str(exc)

    async def extract_info(self, url: str) -> Tuple[Optional[dict], Optional[str]]:
        return await asyncio.to_thread(self._run_extract_info, url)

    async def download(self, url: str, format_id: Optional[str] = None) -> Tuple[Optional[str], Optional[dict], Optional[str]]:
        return await asyncio.wait_for(
            asyncio.to_thread(self._run_download, url, format_id),
            timeout=self.timeout,
        )
