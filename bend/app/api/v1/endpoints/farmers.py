import re
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.models.product import Farmer
from sqlalchemy import select
from app.utils.storage import upload_to_minio
from fastapi import UploadFile, File, Form
from typing import Optional
from sqlalchemy.orm import selectinload
from app.core.security import get_password_hash
from app.models.user import User
from app.api.deps import get_current_admin
from pydantic import EmailStr, validate_email
from pydantic_core import PydanticCustomError

logger = logging.getLogger(__name__)
router = APIRouter()


def validate_password_strength(password: str) -> None:
    """Validate password meets security requirements."""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r'\d', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit")


def validate_email_format(email: str) -> str:
    """Validate email format."""
    try:
        validated = validate_email(email)
        return validated[1]  # Return normalized email
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid email format")


@router.get("/")
async def list_farmers(db: AsyncSession = Depends(get_db)):
    """Get all farmers. Public endpoint for storefront."""
    result = await db.execute(select(Farmer))
    return result.scalars().all()


@router.post("/")
async def register_farmer(
    name: str = Form(..., min_length=2, max_length=100),
    email: str = Form(...),
    password: str = Form(...),
    location: str = Form(..., min_length=5, max_length=200),
    bio: str = Form(..., min_length=10, max_length=1000),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Register a new farmer. Admin only."""
    # Validate inputs
    name = name.strip()
    location = location.strip()
    bio = bio.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    # Validate email format
    email = validate_email_format(email)

    # Validate password strength
    validate_password_strength(password)

    # Check if email already exists
    existing_user = await db.execute(select(User).where(User.email == email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        # Upload profile picture if provided
        profile_pic_url = await upload_to_minio(file) if file else None

        # Create the Farmer Profile
        new_farmer = Farmer(name=name, location=location, bio=bio, profile_pic=profile_pic_url)
        db.add(new_farmer)
        await db.flush()

        # Create the User Login Account
        new_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role="farmer",
            farmer_id=new_farmer.id
        )
        db.add(new_user)

        await db.commit()
        return {"message": "Farmer and User account created successfully", "farmer_id": new_farmer.id}

    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating farmer: {e}")
        raise HTTPException(status_code=500, detail="Failed to create farmer account")

@router.get("/{farmer_id}")
async def get_farmer_details(farmer_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Farmer)
        .options(selectinload(Farmer.products)) # Load the farmer's products
        .where(Farmer.id == farmer_id)
    )
    farmer = result.scalar_one_or_none()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer