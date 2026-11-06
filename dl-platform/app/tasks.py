import asyncio
from datetime import datetime, timedelta, timezone

from app.config import settings
from app.database import AsyncSessionLocal
from app.file_store import cleanup_expired_tokens, cleanup_orphan_files
from app.models import UsageLog

CLEANUP_INTERVAL_SECONDS = 300


async def cleanup_old_usage_logs(days: int = 90) -> int:
    """Delete usage logs older than N days. Returns count deleted."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            UsageLog.__table__.delete().where(UsageLog.created_at < cutoff)  # type: ignore[attr-defined]
        )
        await session.commit()
        return result.rowcount


def cleanup_downloads() -> tuple[int, int]:
    expired = cleanup_expired_tokens()
    orphans = cleanup_orphan_files(settings.DOWNLOAD_ORPHAN_MAX_AGE_SECONDS)
    return expired, orphans


async def run_cleanup() -> None:
    last_usage_sweep = 0.0
    while True:
        try:
            expired, orphans = cleanup_downloads()
            if expired or orphans:
                print(
                    f"[cleanup] removed {expired} expired tokens, "
                    f"{orphans} orphaned files"
                )
            now = asyncio.get_running_loop().time()
            if now - last_usage_sweep >= 86400:
                deleted = await cleanup_old_usage_logs()
                if deleted:
                    print(f"[cleanup] deleted {deleted} old usage logs")
                last_usage_sweep = now
        except Exception as exc:  # pragma: no cover - background task
            print(f"[cleanup] error: {exc}")
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
