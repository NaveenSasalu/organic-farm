import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Secrets from K8s
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    
    # DB (Pointing to infra namespace)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://farmuser:pass@postgres-service.infra.svc.cluster.local:5432/farmdb"
    )

    # MinIO (Pointing to infra namespace)
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "minio-service.infra.svc.cluster.local:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY")
    MINIO_BUCKET: str = "organic-farm"

settings = Settings()