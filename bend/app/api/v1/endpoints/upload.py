import boto3
from fastapi import APIRouter, UploadFile, File, Depends
from app.core.config import settings

router = APIRouter()

s3_client = boto3.client(
    "s3",
    endpoint_url=f"{settings.MINIO_ENDPOINT}",
    aws_access_key_id=settings.MINIO_ACCESS_KEY,
    aws_secret_access_key=settings.MINIO_SECRET_KEY,
)

@router.post("/{product_id}/image")
async def upload_product_image(product_id: int, file: UploadFile = File(...)):
    # 1. Upload to MinIO
    file_content = await file.read()
    s3_client.put_object(
        Bucket=settings.MINIO_BUCKET_NAME,
        Key=f"{product_id}_{file.filename}",
        Body=file_content,
        ContentType=file.content_type
    )
    
    # 2. Return the path (In real app, update DB here)
    image_path = f"{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET_NAME}/{product_id}_{file.filename}"
    return {"image_url": image_path}