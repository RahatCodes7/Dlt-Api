import asyncio
from datetime import datetime, timedelta, timezone

from app.database import AsyncSessionLocal
from app.file_store import cleanup_expired_tokens
from app.models import UsageLog


async def cleanup_old_usage_logs(days: int = 90) -> int:
    """Delete usage logs older than N days. Returns count deleted."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            UsageLog.__table__.delete().where(UsageLog.created_at < cutoff)  # type: ignore[attr-defined]
        )
        await session.commit()
        return result.rowcount


async def run_cleanup() -> None:
    while True:
        await asyncio.sleep(86400)  # run daily
        try:
            deleted = await cleanup_old_usage_logs()
            if deleted:
                print(f"[cleanup] deleted {deleted} old usage logs")
            expired_files = cleanup_expired_tokens()
            if expired_files:
                print(f"[cleanup] removed {expired_files} expired download tokens")
        except Exception as exc:  # pragma: no cover - background task
            print(f"[cleanup] error: {exc}")
