import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Secrets from K8s
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    
    # DB (Pointing to infra namespace)
    DATABASE_URL: str = os.getenv("database-url")
        
    # MinIO (Pointing to infra namespace)
    #MINIO_ENDPOINT: str = "minio-service.infra.svc.cluster.local:9000"
    MINIO_ENDPOINT: str = "mnio.kaayaka.in:9000"
    MINIO_ACCESS_KEY: str = os.getenv("minio-root-user")
    MINIO_SECRET_KEY: str = os.getenv("minio-password")
    MINIO_BUCKET: str = "organic-farm"

settings = Settings()

# import os
# from pydantic_settings import BaseSettings

# class Settings(BaseSettings):
#     # This will now throw an error on startup if NOT found in Env
#     SECRET_KEY: str 
#     DATABASE_URL: str

#     class Config:
#         # This allows pydantic to read from a .env file locally 
#         # but prioritize real environment variables in K8s
#         env_file = ".env"

# settings = Settings()