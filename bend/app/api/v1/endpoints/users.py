from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy import select, update
from app.api.deps import get_current_admin
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.enums import UserRole

router = APIRouter()


@router.get("/")
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get all users. Admin only."""
    result = await db.execute(select(User))
    return result.scalars().all()


@router.patch("/{user_id}/role")
async def update_user_role(
    user_id: int = Path(..., gt=0),
    role: UserRole = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update user role. Admin only."""
    # Check if user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from demoting themselves
    if user.id == admin.id and role != UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot change your own admin role")

    await db.execute(update(User).where(User.id == user_id).values(role=role.value))
    await db.commit()
    return {"message": "Role updated", "new_role": role.value}