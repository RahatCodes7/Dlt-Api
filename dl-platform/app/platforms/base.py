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

try:  # Optional: bundled static ffmpeg so merged downloads work anywhere.
    import imageio_ffmpeg

    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:  # noqa: BLE001
    FFMPEG_PATH = None

from app.config import settings
from app.proxies import proxy_to_yt_dlp_format

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
    """yt-dlp backed engine shared across platforms with proxy rotation."""

    def __init__(
        self,
        platform: str,
        url_patterns: list,
        timeout: int = 60,
        proxy_rotator=None,
    ):
        self.platform = platform
        self.url_patterns = url_patterns
        self.timeout = timeout
        self.proxy_rotator = proxy_rotator

    def matches(self, url: str) -> bool:
        return any(re.search(p, url, re.IGNORECASE) for p in self.url_patterns)

    def _ydl_opts(self, download: bool = False, format_id: Optional[str] = None, proxy: Optional[str] = None) -> dict:
        opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": False,
            "socket_timeout": 30,
            "retries": 1,
            "fragment_retries": 1,
            "extractor_retries": 1,
            "skip_download": not download,
        }
        if proxy:
            opts["proxy"] = proxy
        if FFMPEG_PATH:
            opts["ffmpeg_location"] = FFMPEG_PATH
        if download:
            opts["outtmpl"] = os.path.join(tempfile.gettempdir(), "dlt_%(id)s.%(ext)s")
            # A playlist would drop several files into the temp dir and make
            # "the downloaded file" ambiguous, so always take a single item.
            opts["noplaylist"] = True

            requested = (format_id or "").strip()
            selector = requested.lower()

            if selector in {"mp3", "m4a", "audio"}:
                opts["format"] = "bestaudio[ext=m4a]/bestaudio/best"
                if selector == "mp3" and FFMPEG_PATH:
                    opts["postprocessors"] = [
                        {
                            "key": "FFmpegExtractAudio",
                            "preferredcodec": "mp3",
                            "preferredquality": "192",
                        }
                    ]
            elif selector in {"", "mp4", "video", "best"}:
                # Best available video + audio. Prefer mp4/m4a first so the
                # merged result is broadly playable, then fall back to anything.
                opts["format"] = "bv*[ext=mp4]+ba[ext=m4a]/bv*+ba/b"
                if FFMPEG_PATH:
                    opts["merge_output_format"] = "mp4"
            elif selector.endswith("p") and selector[:-1].isdigit():
                height = int(selector[:-1])
                opts["format"] = (
                    f"bv*[height<={height}][ext=mp4]+ba[ext=m4a]/"
                    f"b[height<={height}][ext=mp4]/"
                    f"bv*[height<={height}]+ba/b[height<={height}]/b"
                )
                if FFMPEG_PATH:
                    opts["merge_output_format"] = "mp4"
            else:
                # Exact yt-dlp format id / selector, e.g. "18" or "137+140".
                opts["format"] = requested
                if FFMPEG_PATH and "+" in requested:
                    opts["merge_output_format"] = "mp4"
        return opts

    def _run_extract_info(
        self, url: str, proxy: Optional[str] = None
    ) -> Tuple[Optional[dict], Optional[str]]:
        try:
            with yt_dlp.YoutubeDL(self._ydl_opts(download=False, proxy=proxy)) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info:
                    return None, "Could not extract video info"
                return info, None
        except Exception as exc:  # noqa: BLE001
            log.exception("yt-dlp extract_info failed for %s via proxy %s", url, proxy)
            return None, str(exc)

    def _run_download(
        self, url: str, format_id: Optional[str] = None, proxy: Optional[str] = None
    ) -> Tuple[Optional[str], Optional[dict], Optional[str]]:
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                opts = self._ydl_opts(download=True, format_id=format_id, proxy=proxy)
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
                            # A unique suffix prevents two concurrent requests
                            # (or two users downloading the same video) from
                            # overwriting/deleting each other's file.
                            suffix = uuid.uuid4().hex[:12]
                            permanent = DOWNLOAD_DIR / f"{safe_title}_{self.platform}_{suffix}{ext}"
                            os.replace(fpath, permanent)
                            return str(permanent), info, None
                    return None, info, "No file downloaded"
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            log.exception("yt-dlp download failed for %s via proxy %s", url, proxy)
            return None, None, str(exc)

    async def _proxy_attempts(self) -> list[str]:
        """Return a de-duplicated list of proxies to try for this request."""
        if not self.proxy_rotator or settings.PROXY_MODE == "off":
            return []
        seen: set[str] = set()
        attempts: list[str] = []
        limit = max(0, min(settings.PROXY_MAX_ATTEMPTS, len(self.proxy_rotator.proxies)))
        for _ in range(limit):
            proxy_url = await self.proxy_rotator.get_next()
            if proxy_url and proxy_url not in seen:
                seen.add(proxy_url)
                attempts.append(proxy_url)
        return attempts

    def _ordered_attempts(self, proxies: list[str]) -> list[Optional[str]]:
        """Proxy is tried first only when PROXY_MODE=always."""
        if settings.PROXY_MODE == "always" and proxies:
            return [*proxies, None]
        return [None, *proxies]

    async def extract_info(self, url: str) -> Tuple[Optional[dict], Optional[str]]:
        """Extract metadata, falling back to rotating proxies when blocked."""
        proxies = await self._proxy_attempts()
        last_error = "Could not extract video info"

        for proxy_url in self._ordered_attempts(proxies):
            try:
                info, error = await asyncio.wait_for(
                    asyncio.to_thread(self._run_extract_info, url, proxy_url),
                    timeout=self.timeout,
                )
            except asyncio.TimeoutError:
                info, error = None, f"Timed out after {self.timeout}s"
            except asyncio.CancelledError:
                raise

            if not error and info:
                if proxy_url and self.proxy_rotator:
                    self.proxy_rotator.report_success(proxy_url)
                return info, None

            last_error = error or last_error
            if proxy_url and self.proxy_rotator:
                self.proxy_rotator.report_failure(proxy_url)

        return None, last_error

    async def download(
        self, url: str, format_id: Optional[str] = None
    ) -> Tuple[Optional[str], Optional[dict], Optional[str]]:
        """Download with proxy rotation and retry on failure.

        PROXY_MODE=auto (default) tries a direct connection first, then rotates
        through healthy proxies. PROXY_MODE=always prefers proxies first.
        """
        proxies = await self._proxy_attempts()
        last_error = "Download failed"

        for proxy_url in self._ordered_attempts(proxies):
            try:
                file_path, info, error = await asyncio.wait_for(
                    asyncio.to_thread(self._run_download, url, format_id, proxy_url),
                    timeout=self.timeout,
                )
            except asyncio.TimeoutError:
                file_path, info, error = None, None, f"Timed out after {self.timeout}s"
            except asyncio.CancelledError:
                raise

            if not error and file_path:
                if proxy_url and self.proxy_rotator:
                    self.proxy_rotator.report_success(proxy_url)
                return file_path, info, None

            last_error = error or last_error
            if proxy_url and self.proxy_rotator:
                self.proxy_rotator.report_failure(proxy_url)

        return None, None, last_error
