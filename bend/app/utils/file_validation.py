"""
File upload validation utilities.
"""
from fastapi import UploadFile, HTTPException
from typing import Set, Optional
import magic  # python-magic for MIME type detection
import logging

logger = logging.getLogger(__name__)

# Configuration
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB for images

# Allowed MIME types
ALLOWED_IMAGE_TYPES: Set[str] = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
}

ALLOWED_DOCUMENT_TYPES: Set[str] = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

# File extension to MIME type mapping for validation
EXTENSION_MIME_MAP = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
}


async def validate_file_size(
    file: UploadFile,
    max_size: int = MAX_FILE_SIZE
) -> bytes:
    """
    Validate file size and return file contents.

    Args:
        file: The uploaded file
        max_size: Maximum allowed size in bytes

    Returns:
        File contents as bytes

    Raises:
        HTTPException: If file is too large
    """
    contents = await file.read()
    size = len(contents)

    if size > max_size:
        max_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {max_mb:.1f} MB"
        )

    # Reset file position for subsequent reads
    await file.seek(0)

    return contents


def validate_mime_type(
    contents: bytes,
    allowed_types: Set[str],
    filename: Optional[str] = None
) -> str:
    """
    Validate file MIME type using magic bytes.

    Args:
        contents: File contents as bytes
        allowed_types: Set of allowed MIME types
        filename: Optional filename for additional validation

    Returns:
        Detected MIME type

    Raises:
        HTTPException: If MIME type is not allowed
    """
    try:
        # Detect MIME type from file contents (magic bytes)
        mime = magic.Magic(mime=True)
        detected_type = mime.from_buffer(contents)
    except Exception as e:
        logger.warning(f"Could not detect MIME type: {e}")
        # Fall back to extension-based detection
        if filename:
            ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            detected_type = EXTENSION_MIME_MAP.get(ext, "application/octet-stream")
        else:
            detected_type = "application/octet-stream"

    if detected_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"File type '{detected_type}' is not allowed. Allowed types: {', '.join(allowed_types)}"
        )

    # Additional check: verify extension matches MIME type
    if filename and "." in filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower()
        expected_mime = EXTENSION_MIME_MAP.get(ext)
        if expected_mime and expected_mime != detected_type:
            logger.warning(
                f"MIME type mismatch: extension suggests {expected_mime}, "
                f"but content is {detected_type}"
            )
            # Allow if the detected type is still in allowed types
            # This handles cases like .jpg files that are actually PNGs

    return detected_type


async def validate_image_upload(
    file: UploadFile,
    max_size: int = MAX_IMAGE_SIZE
) -> tuple[bytes, str]:
    """
    Validate an image upload.

    Args:
        file: The uploaded file
        max_size: Maximum allowed size in bytes

    Returns:
        Tuple of (file contents, MIME type)

    Raises:
        HTTPException: If validation fails
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate size
    contents = await validate_file_size(file, max_size)

    # Validate MIME type
    mime_type = validate_mime_type(
        contents,
        ALLOWED_IMAGE_TYPES,
        file.filename
    )

    logger.info(
        f"Image upload validated: {file.filename} ({len(contents)} bytes, {mime_type})"
    )

    return contents, mime_type


async def validate_document_upload(
    file: UploadFile,
    max_size: int = MAX_FILE_SIZE
) -> tuple[bytes, str]:
    """
    Validate a document upload.

    Args:
        file: The uploaded file
        max_size: Maximum allowed size in bytes

    Returns:
        Tuple of (file contents, MIME type)

    Raises:
        HTTPException: If validation fails
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate size
    contents = await validate_file_size(file, max_size)

    # Validate MIME type
    mime_type = validate_mime_type(
        contents,
        ALLOWED_DOCUMENT_TYPES,
        file.filename
    )

    logger.info(
        f"Document upload validated: {file.filename} ({len(contents)} bytes, {mime_type})"
    )

    return contents, mime_type
