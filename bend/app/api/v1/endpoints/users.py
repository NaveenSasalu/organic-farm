from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from app.api.deps import get_current_admin
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter()

@router.get("/")
async def get_all_users(db: AsyncSession = Depends(get_db), admin: User = Depends(get_current_admin)):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.patch("/{user_id}/role")
async def update_user_role(
    user_id: int, 
    role: str, 
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    if role not in ["admin", "farmer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    await db.execute(update(User).where(User.id == user_id).values(role=role))
    await db.commit()
    return {"message": "Role updated"}