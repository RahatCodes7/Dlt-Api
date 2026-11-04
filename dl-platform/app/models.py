import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

from datetime import datetime, timezone


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    email_verification_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    password_reset_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    password_reset_expires: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=utc_now)
    plan_id: Mapped[Optional[int]] = mapped_column(ForeignKey("plans.id"), nullable=True)

    plan = relationship("Plan", back_populates="users", lazy="selectin")
    api_keys = relationship("ApiKey", back_populates="user", lazy="selectin", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", lazy="selectin", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", lazy="selectin", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", lazy="selectin", cascade="all, delete-orphan")


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    monthly_requests: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    users = relationship("User", back_populates="plan", lazy="selectin")
    subscriptions = relationship("Subscription", back_populates="plan", lazy="selectin")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    platforms: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(50), default="active")
    last_used: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="api_keys", lazy="selectin")
    usage_logs = relationship("UsageLog", back_populates="api_key", lazy="selectin", cascade="all, delete-orphan")


class ApiProduct(Base):
    __tablename__ = "api_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price_monthly: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"), nullable=False)
    start: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User", back_populates="subscriptions", lazy="selectin")
    plan = relationship("Plan", back_populates="subscriptions", lazy="selectin")


class UsageCounter(Base):
    __tablename__ = "usage_counters"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    month: Mapped[str] = mapped_column(String(7), primary_key=True)  # YYYY-MM
    count: Mapped[int] = mapped_column(Integer, default=0)


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    api_key_id: Mapped[Optional[int]] = mapped_column(ForeignKey("api_keys.id"), nullable=True)
    product: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="usage_logs", lazy="selectin")
    api_key = relationship("ApiKey", back_populates="usage_logs", lazy="selectin")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="BDT")
    method: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="transactions", lazy="selectin")


class Proxy(Base):
    __tablename__ = "proxies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(20), default="http")
    host: Mapped[str] = mapped_column(String(255), nullable=False)
    port: Mapped[int] = mapped_column(Integer, nullable=False)
    user: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    pass_encrypted: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    last_checked: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    target: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
