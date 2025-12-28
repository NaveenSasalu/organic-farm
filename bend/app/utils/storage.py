import os
from minio import Minio
from fastapi import UploadFile
import uuid

# Connect to your Dockerized MinIO
MINIO_CLIENT = Minio(
    "localhost:9000",
    access_key="farm_admin",
    secret_key="farm_password123",
    secure=False
)

BUCKET_NAME = "products"

async def upload_to_minio(file: UploadFile) -> str:
    # 1. Create unique filename to prevent overwriting
    extension = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4()}.{extension}"
    
    # 2. Read file data
    file_data = await file.read()
    file_size = len(file_data)
    
    # 3. Upload to MinIO
    from io import BytesIO
    MINIO_CLIENT.put_object(
        BUCKET_NAME,
        unique_name,
        BytesIO(file_data),
        length=file_size,
        content_type=file.content_type
    )
    
    # 4. Return the public URL
    return f"http://localhost:9000/{BUCKET_NAME}/{unique_name}"