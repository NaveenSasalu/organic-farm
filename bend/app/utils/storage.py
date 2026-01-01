import uuid
from io import BytesIO
from minio import Minio
from fastapi import UploadFile
from app.core.config import settings

# Initialize client using the INTERNAL service name
# This ensures the backend doesn't need to go out to the internet to upload
MINIO_CLIENT = Minio(
    "minio-service.infra.svc.cluster.local:9000", # Use the internal K8s DNS
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False # Internal cluster traffic is usually plain HTTP
)

BUCKET_NAME = settings.MINIO_BUCKET

async def upload_to_minio(file: UploadFile) -> str:
    # 1. Create unique filename
    extension = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{extension}"
    
    # 2. Read file data
    file_data = await file.read()
    file_size = len(file_data)
    
    # 3. Upload to MinIO via INTERNAL connection
    MINIO_CLIENT.put_object(
        BUCKET_NAME,
        unique_name,
        BytesIO(file_data),
        length=file_size,
        content_type=file.content_type
    )
    
    # 4. Return the EXTERNAL HTTPS URL for the browser
    # NOTE: Remove the :9000 if your Ingress handles standard HTTPS (443)
    return f"https://mnio.kaayaka.in/{BUCKET_NAME}/{unique_name}"