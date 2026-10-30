from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List
import re
import secrets


class Settings(BaseSettings):
    # ── Database ────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://bhanuprasadh@localhost:5432/studyhub_db"

    # ── JWT ─────────────────────────────────────────────────────────────
    # IMPORTANT: Override SECRET_KEY in production via environment variable.
    # The default is intentionally weak to signal it must be replaced.
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_openssl_rand_hex_32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15          # short-lived (15 min)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7              # HttpOnly cookie

    # ── Environment ──────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"               # development | testing | production
    TESTING: bool = False                           # Set to True to disable rate limiting in pytest

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # ── Rate limiting & Redis ────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    RATE_LIMIT_AUTH: str = "5/minute"              # login/register
    RATE_LIMIT_API: str = "60/minute"              # general endpoints
    RATE_LIMIT_STORAGE: str = "auto"               # 'redis', 'memory', or 'auto'

    # ── Account lockout ───────────────────────────────────────────────────
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if v.startswith("CHANGE_ME") or len(v) < 32:
            import os
            env = os.getenv("ENVIRONMENT", "development")
            if env == "production":
                raise ValueError(
                    "SECRET_KEY must be set to a strong random value in production. "
                    "Generate one with: openssl rand -hex 32"
                )
        return v

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()
