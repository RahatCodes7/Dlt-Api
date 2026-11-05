from typing import Optional

from pydantic import Field, model_validator
from pydantic import AliasChoices
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DLT API Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_STR: str = "/v1/dlt"
    SECRET_KEY: str = "change-me-in-production-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database (PostgreSQL in prod, SQLite for local dev)
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./dl_platform.db",
        validation_alias=AliasChoices("DLT_DATABASE_URL", "DATABASE_URL"),
    )

    @model_validator(mode="after")
    def _normalize_db_url(self):
        url = (self.DATABASE_URL or "").strip()
        if not url:
            url = "sqlite+aiosqlite:///./dl_platform.db"
        if url.startswith("postgres://"):
            url = "postgresql+psycopg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and "+psycopg" not in url:
            url = "postgresql+psycopg://" + url[len("postgresql://"):]
        self.DATABASE_URL = url
        return self

    # Redis (rate limiting / cache)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    API_KEY_PREFIX: str = "dl_live"
    API_KEY_LENGTH: int = 32

    # Download limits
    DOWNLOAD_TIMEOUT_SECONDS: int = 60
    FILE_URL_TTL_SECONDS: int = 300
    MAX_CONCURRENT_DOWNLOADS: int = 10

    # Email (Resend)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@yourdomain.com"
    RESEND_FROM_NAME: str = "DELETE"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""

    # JWT
    JWT_SECRET_KEY: str = "change-me-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    # Must be on the frontend origin (the frontend proxies /v1 to this API).
    # Add the exact value to the Google Cloud OAuth client's redirect URIs.
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/v1/auth/google/callback"
    GOOGLE_AUTH_URL: str = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL: str = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL: str = "https://www.googleapis.com/oauth2/v3/userinfo"

    # Frontend URL (for email links and OAuth redirects)
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS (comma-separated origins). FRONTEND_URL is always allowed.
    CORS_ORIGINS: str = ""
    # Optional regex for additional allowed origins, e.g. https://.*\\.yourdomain\\.com
    CORS_ORIGIN_REGEX: str = ""

    # Auth cookie policy. Empty values pick sensible defaults:
    # SameSite=None + Secure in production, Lax on http local dev.
    COOKIE_SAMESITE: str = ""
    COOKIE_SECURE: Optional[bool] = None

    # Emails that should be granted the admin role on registration
    ADMIN_EMAILS: str = ""

    # Proxy behaviour: auto (direct then proxy), always (proxy then direct), off
    PROXY_MODE: str = "auto"
    PROXY_MAX_ATTEMPTS: int = 3

    # Optional JSON list of proxies to seed on first boot:
    # [{"type":"http","host":"1.2.3.4","port":8080,"user":"u","password":"p","platform":null}]
    INITIAL_PROXIES: str = ""

    # Argon2
    ARGON2_TIME_COST: int = 3
    ARGON2_MEMORY_COST: int = 65536
    ARGON2_PARALLELISM: int = 4

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = "DLT_"


settings = Settings()
