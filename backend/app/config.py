from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    # ── Database ────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://bhanuprasadh@localhost:5432/studyhub_db"

    # ── JWT ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "studyhub_super_secret_jwt_key_for_mtech_project_2026_dev"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60          # 60 min access token
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7             # 7 days refresh token

    # ── Environment ──────────────────────────────────────────────────────
    ENVIRONMENT: str = "development"               # development | testing | production
    TESTING: bool = False                          # Set to True to disable rate limiting in pytest

    # ── CORS ─────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # ── Rate limiting & Redis ────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    RATE_LIMIT_AUTH: str = "20/minute"             # generous auth limit for testing
    RATE_LIMIT_API: str = "120/minute"             # general endpoints
    RATE_LIMIT_STORAGE: str = "auto"               # 'redis', 'memory', or 'auto'

    # ── Account lockout ───────────────────────────────────────────────────
    MAX_FAILED_LOGIN_ATTEMPTS: int = 10
    LOCKOUT_DURATION_MINUTES: int = 15

    # ── Razorpay Payment Gateway ─────────────────────────────────────────
    RAZORPAY_KEY_ID: str = "rzp_test_studyhub_demo"
    RAZORPAY_KEY_SECRET: str = "studyhub_secret_demo_key"
    RAZORPAY_ENABLED: bool = True

    # ── Email & SMTP Notifications ───────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "notifications@studyhub.edu"
    SMTP_FROM_NAME: str = "StudyHub Academic Platform"
    EMAILS_ENABLED: bool = False                   # Set to True when production SMTP credentials provided
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if v.startswith("CHANGE_ME") or len(v) < 32:
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
