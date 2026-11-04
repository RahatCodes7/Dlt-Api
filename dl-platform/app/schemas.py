from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


# ---- Generic response ----
class APIResponse(BaseModel):
    success: bool
    platform: Optional[str] = None
    data: Optional[dict] = None
    request_id: str
    error: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---- Platform info/download ----
class InfoRequest(BaseModel):
    url: HttpUrl


class DownloadRequest(BaseModel):
    url: HttpUrl
    format: Optional[str] = None


# ---- Auth / API keys ----
class ApiKeyCreate(BaseModel):
    name: Optional[str] = None
    platforms: Optional[List[str]] = None


class ApiKeyOut(BaseModel):
    id: int
    name: Optional[str]
    platforms: List[str] = []
    status: str
    last_used: Optional[datetime]
    created_at: datetime
    # full key only shown at creation
    key: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreatedOut(ApiKeyOut):
    key: str


# ---- Account / quota ----
class QuotaOut(BaseModel):
    user_id: int
    month: str
    limit: int
    used: int
    remaining: int
    reset_at: Optional[datetime] = None


# ---- Plans / subscriptions ----
class PlanOut(BaseModel):
    id: int
    name: str
    monthly_requests: int
    price: Optional[float]
    active: bool

    model_config = ConfigDict(from_attributes=True)


class SubscriptionOut(BaseModel):
    id: int
    plan: PlanOut
    status: str
    start: datetime
    end: Optional[datetime]
    auto_renew: bool

    model_config = ConfigDict(from_attributes=True)
