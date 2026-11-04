from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DLT API Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_STR: str = "/v1/dlt"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database (PostgreSQL in prod, SQLite for local dev)
    DATABASE_URL: str = "sqlite+aiosqlite:///./dl_platform.db"

    # Redis (rate limiting / cache)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    API_KEY_PREFIX: str = "dl_live"
    API_KEY_LENGTH: int = 32

    # Download limits
    DOWNLOAD_TIMEOUT_SECONDS: int = 60
    MAX_CONCURRENT_DOWNLOADS: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = "DLT_"


settings = Settings()
