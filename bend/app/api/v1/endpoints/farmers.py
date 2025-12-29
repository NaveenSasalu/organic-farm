from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.product import Farmer
from sqlalchemy import select
from app.utils.storage import upload_to_minio
from fastapi import UploadFile, File, Form
from typing import Optional
from sqlalchemy.orm import selectinload
from app.core.security import get_password_hash
from app.models.user import User
from app.api.deps import get_current_admin

router = APIRouter()

@router.get("/")
async def list_farmers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Farmer))
    return result.scalars().all()

@router.post("/")
async def register_farmer(
    name: str = Form(...),
    email: str = Form(...),      # Add email field
    password: str = Form(...),   # Add password field
    location: str = Form(...),
    bio: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin) # Only admins can do this
):
    # 1. Create the Farmer Profile
    profile_pic_url = await upload_to_minio(file) if file else None
    new_farmer = Farmer(name=name, location=location, bio=bio, profile_pic=profile_pic_url)
    db.add(new_farmer)
    await db.flush() # This gets us the new_farmer.id before committing

    # 2. Create the User Login Account
    new_user = User(
        email=email,
        hashed_password=get_password_hash(password),
        role="farmer",
        farmer_id=new_farmer.id
    )
    db.add(new_user)
    
    await db.commit()
    return {"message": "Farmer and User account created successfully"}

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