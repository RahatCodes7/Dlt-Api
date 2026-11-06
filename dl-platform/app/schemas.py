from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, HttpUrl


# ---- Generic response ----
class ErrorDetail(BaseModel):
    code: str
    message: str
    retry_after: Optional[int] = None


class APIResponse(BaseModel):
    success: bool
    platform: Optional[str] = None
    data: Optional[dict] = None
    request_id: str
    error: Optional[ErrorDetail] = None
    # Human-readable mirror of error.message, kept for older clients that
    # read a flat "detail" string.
    detail: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---- Platform info/download ----
class InfoRequest(BaseModel):
    url: HttpUrl


class DownloadRequest(BaseModel):
    url: HttpUrl
    # "mp4", "mp3", "m4a", a height such as "720p", or a raw yt-dlp selector.
    format: Optional[str] = None
    # Preferred quality selector, e.g. "360p", "720p", "1080p", "best".
    quality: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("quality", "resolution"),
    )
    # Exact yt-dlp format id, e.g. "18" or "137+140". Takes precedence.
    format_id: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("format_id", "formatId"),
    )


# ---- Auth ----
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str
    remember: bool = True


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


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


# ---- Proxies ----
class ProxyCreate(BaseModel):
    type: str = "http"
    host: str
    port: int
    user: Optional[str] = None
    password: Optional[str] = None
    platform: Optional[str] = None


# ---- Account / quota ----
class QuotaOut(BaseModel):
    plan: Optional[str] = None
    user_id: int
    month: str
    limit: int
    used: int
    remaining: int
    # Both names are returned: resets_at matches the public docs, reset_at is
    # kept for clients built against the earlier response.
    reset_at: Optional[datetime] = None
    resets_at: Optional[datetime] = None


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
