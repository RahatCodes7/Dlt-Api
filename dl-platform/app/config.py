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
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/v1/auth/google/callback"

    # Frontend URL (for email links)
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS (comma-separated origins). FRONTEND_URL is always allowed.
    CORS_ORIGINS: str = ""

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
