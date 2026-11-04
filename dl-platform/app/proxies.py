from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Proxy


async def get_healthy_proxies(
    session: AsyncSession, platform: Optional[str] = None
) -> List[Proxy]:
    query = select(Proxy).where(Proxy.status == "active")
    if platform:
        query = query.where((Proxy.platform == platform) | (Proxy.platform.is_(None)))
    result = await session.execute(query)
    return list(result.scalars().all())
