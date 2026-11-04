from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_session
from app.models import Plan, Subscription, Transaction, User


async def get_plan_by_id(session: AsyncSession, plan_id: int) -> Optional[Plan]:
    result = await session.execute(select(Plan).where(Plan.id == plan_id))
    return result.scalar_one_or_none()


async def create_subscription(
    session: AsyncSession, user: User, plan: Plan
) -> Subscription:
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=30) if plan.monthly_requests > 0 else None
    sub = Subscription(
        user_id=user.id,
        plan_id=plan.id,
        start=now,
        end=end,
        status="active",
        auto_renew=False,
    )
    session.add(sub)
    await session.commit()
    await session.refresh(sub)
    return sub


async def record_transaction(
    session: AsyncSession,
    user: User,
    amount: float,
    currency: str = "BDT",
    method: str = "manual",
    status: str = "pending",
    ref: Optional[str] = None,
) -> Transaction:
    tx = Transaction(
        user_id=user.id,
        amount=amount,
        currency=currency,
        method=method,
        status=status,
        ref=ref,
    )
    session.add(tx)
    await session.commit()
    await session.refresh(tx)
    return tx


async def is_subscription_active(session: AsyncSession, user: User) -> bool:
    if not user.plan or not user.plan.active:
        return False
    result = await session.execute(
        select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.plan_id == user.plan.id,
            Subscription.status == "active",
        )
    )
    sub = result.scalar_one_or_none()
    if sub is None:
        return False
    if sub.end and sub.end < datetime.now(timezone.utc):
        return False
    return True
