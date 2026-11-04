import asyncio
import random
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Proxy


class ProxyRotator:
    """Round-robin proxy rotator with health tracking."""

    def __init__(self, proxies: List[Proxy]):
        self.proxies = proxies
        self._index = 0
        self._lock = asyncio.Lock()
        self._failures: dict[int, int] = {p.id: 0 for p in proxies}
        self._max_failures = 3

    def _proxy_url(self, proxy: Proxy) -> str:
        scheme = "http"
        auth = ""
        if proxy.user and proxy.pass_encrypted:
            auth = f"{proxy.user}:{proxy.pass_encrypted}@"
        return f"{scheme}://{auth}{proxy.host}:{proxy.port}"

    async def get_next(self) -> Optional[str]:
        """Get the next healthy proxy URL (round-robin)."""
        async with self._lock:
            if not self.proxies:
                return None
            healthy = [p for p in self.proxies if self._failures.get(p.id, 0) < self._max_failures]
            if not healthy:
                # Reset failures if all are down
                self._failures = {p.id: 0 for p in self.proxies}
                healthy = self.proxies
            proxy = healthy[self._index % len(healthy)]
            self._index += 1
            return self._proxy_url(proxy)

    def report_success(self, proxy_url: str) -> None:
        """Reset failure count for a successful proxy."""
        for p in self.proxies:
            if self._proxy_url(p) == proxy_url:
                self._failures[p.id] = 0
                break

    def report_failure(self, proxy_url: str) -> None:
        """Increment failure count for a failed proxy."""
        for p in self.proxies:
            if self._proxy_url(p) == proxy_url:
                self._failures[p.id] = self._failures.get(p.id, 0) + 1
                break


_rotators: dict[str, ProxyRotator] = {}


def get_rotator(platform: str, proxies: List[Proxy]) -> ProxyRotator:
    """Create a new rotator each time (proxies list may have changed)."""
    key = platform or "global"
    _rotators[key] = ProxyRotator(proxies)
    return _rotators[key]


def proxy_to_yt_dlp_format(proxy_url: str) -> str:
    """Convert proxy URL to yt-dlp compatible format."""
    return proxy_url
