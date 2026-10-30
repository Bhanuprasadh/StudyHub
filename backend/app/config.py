from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://bhanuprasadh@localhost:5432/studyhub_db"
    SECRET_KEY: str = "studyhub_super_secret_jwt_key_for_mtech_project_2026_dev"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = "rzp_test_studyhub_demo"
    RAZORPAY_KEY_SECRET: str = "studyhub_secret_demo_key"
    RAZORPAY_ENABLED: bool = True

    # Email & SMTP Notifications
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "notifications@studyhub.edu"
    SMTP_FROM_NAME: str = "StudyHub Academic Platform"
    EMAILS_ENABLED: bool = False  # Set to True when production SMTP credentials provided
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
