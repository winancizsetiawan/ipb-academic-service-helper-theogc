from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Comma-separated list of allowed CORS origins.
    # Defaults to "*" (wildcard) which is safe because auth relies on JWT Bearer
    # tokens, not cookies. Set to a specific origin in Railway if desired.
    CORS_ORIGINS: str = "*"
    BASE_URL: str = "http://localhost:5173"

    # Upload directory path (use a persistent volume path on Railway)
    UPLOAD_DIR: str = "uploads"

    # Set to "true" to seed demo accounts/categories/FAQs on startup.
    # Must be "false" (default) in production.
    ENABLE_DEMO_SEEDING: bool = False

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()