import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "local-dev-secret-key")

    # Database
    DATABASE_URL: str = os.getenv(
        "database-url",
        "postgresql+asyncpg://organic:organic123@localhost:5432/organic_farm"
    )

    # MinIO Configuration
    MINIO_INTERNAL_ENDPOINT: str = os.getenv("MINIO_INTERNAL_ENDPOINT", "localhost:9000")
    MINIO_EXTERNAL_URL: str = os.getenv("MINIO_EXTERNAL_URL", "http://localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("minio-root-user", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("minio-password", "minioadmin123")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "organic-farm")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()