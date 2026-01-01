import uuid
from io import BytesIO
from minio import Minio
from fastapi import UploadFile
from app.core.config import settings

# Initialize client using sanitized settings
MINIO_CLIENT = Minio(
    settings.MINIO_ENDPOINT,        # e.g., "minio-service.infra.svc.cluster.local:9000"
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False # Use False for internal cluster traffic
)

BUCKET_NAME = settings.MINIO_BUCKET

async def upload_to_minio(file: UploadFile) -> str:
    # 1. Create unique filename
    extension = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{extension}"
    
    # 2. Read file data
    file_data = await file.read()
    file_size = len(file_data)
    
    # 3. Upload to MinIO
    MINIO_CLIENT.put_object(
        BUCKET_NAME,
        unique_name,
        BytesIO(file_data),
        length=file_size,
        content_type=file.content_type
    )
    
    # 4. Return the Production URL
    # Note: We use the public domain for the returned link so the browser can see it
    #return f"https://of.kaayaka.in/storage/{BUCKET_NAME}/{unique_name}"
    return f"https://mnio.kaayaka.in:9000/storage/{BUCKET_NAME}/{unique_name}"