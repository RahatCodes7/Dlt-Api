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
    otp: Optional[str] = None


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


# ---- System settings (API Configuration) ----
class SystemSettingOut(BaseModel):
    key: str
    value: str

    model_config = ConfigDict(from_attributes=True)


class SystemSettingUpdate(BaseModel):
    key: str
    value: str


# ---- Transactions ----
class TransactionOut(BaseModel):
    id: int
    amount: float
    currency: str
    method: str
    status: str
    ref: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---- Admin: plans ----
class PlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    monthly_requests: int = Field(default=0, ge=0)
    price: Optional[float] = Field(default=None, ge=0)
    active: bool = True


class PlanUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    monthly_requests: Optional[int] = Field(default=None, ge=0)
    price: Optional[float] = Field(default=None, ge=0)
    active: Optional[bool] = None


# ---- Admin: subscriptions ----
class SubscriptionAdminOut(BaseModel):
    id: int
    user_id: int
    user_email: str
    plan: PlanOut
    status: str
    start: datetime
    end: Optional[datetime]
    auto_renew: bool

    model_config = ConfigDict(from_attributes=True)


# ---- Account: API configuration ----
class ApiConfigurationUpdate(BaseModel):
    default_format: str = "mp4"
    default_quality: str = "best"
    default_platform: Optional[str] = None
    timeout_seconds: int = Field(default=120, ge=10, le=600)
    include_metadata: bool = True
    retry_failed: bool = True


# ---- Account: workspace preferences ----
class WorkspacePreferencesUpdate(BaseModel):
    timezone: str = "UTC"
    locale: str = "en-US"
    date_format: str = "MMM d, yyyy"


# ---- Account: notifications ----
class NotificationPreferencesUpdate(BaseModel):
    email_quota: bool = True
    email_incidents: bool = True
    email_product: bool = False


# ---- Account: security ----
class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=255)


class TwoFactorCodeRequest(BaseModel):
    code: str = Field(min_length=6, max_length=8)


class AccountDeleteRequest(BaseModel):
    password: str


# ---- Account: support ----
class SupportTicketCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=255)
    message: str = Field(min_length=3, max_length=5000)
    priority: str = "normal"


class TicketMessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class TicketStatusUpdate(BaseModel):
    status: str = Field(pattern="^(open|pending|closed)$")


class NotificationOut(BaseModel):
    id: int
    title: str
    body: Optional[str]
    type: str
    read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SupportTicketOut(BaseModel):
    id: int
    subject: str
    priority: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    message_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class TicketMessageOut(BaseModel):
    id: int
    author: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
