from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.product import Farmer
from sqlalchemy import select, selectinload
from app.utils.storage import upload_to_minio
from fastapi import UploadFile, File, Form
from typing import Optional
from sqlalchemy.orm import selectinload

router = APIRouter()

@router.get("/")
async def list_farmers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Farmer))
    return result.scalars().all()

@router.post("/")
async def register_farmer(
    name: str = Form(...), 
    location: str = Form(...), 
    bio: str = Form(...),
    file: Optional[UploadFile] = File(None), # The Profile Picture
    db: AsyncSession = Depends(get_db)
):
    profile_pic_url = None
    if file:
        profile_pic_url = await upload_to_minio(file)
        
    new_farmer = Farmer(
        name=name, 
        location=location, 
        bio=bio, 
        profile_pic=profile_pic_url
    )
    db.add(new_farmer)
    await db.commit()
    return {"status": "success", "farmer_id": new_farmer.id}

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