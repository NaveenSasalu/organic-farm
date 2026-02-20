import uuid
from io import BytesIO
from minio import Minio
from fastapi import UploadFile
from app.core.config import settings

# Initialize MinIO client using configurable endpoint
# Local dev: localhost:9000, K8s: minio-service.infra.svc.cluster.local:9000
MINIO_CLIENT = Minio(
    settings.MINIO_INTERNAL_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE
)

BUCKET_NAME = settings.MINIO_BUCKET


def ensure_bucket_exists():
    """Create bucket if it doesn't exist and set public read policy."""
    if not MINIO_CLIENT.bucket_exists(BUCKET_NAME):
        MINIO_CLIENT.make_bucket(BUCKET_NAME)
        # Set bucket policy for public read access
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{BUCKET_NAME}/*"]
                }
            ]
        }
        import json
        MINIO_CLIENT.set_bucket_policy(BUCKET_NAME, json.dumps(policy))


async def upload_to_minio(file: UploadFile) -> str:
    """Upload file to MinIO and return public URL."""
    # Ensure bucket exists
    ensure_bucket_exists()

    # 1. Create unique filename
    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
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
        content_type=file.content_type or "application/octet-stream"
    )

    # 4. Return the public URL for browser access
    # Uses MINIO_EXTERNAL_URL from settings (configurable per environment)
    return f"{settings.MINIO_EXTERNAL_URL}/{BUCKET_NAME}/{unique_name}"
