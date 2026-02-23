import string
import secrets
from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, update, delete
from app.api.deps import get_current_admin
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_password_hash
from app.schemas.enums import UserRole

router = APIRouter()


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    role: str


@router.get("/")
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get all users. Admin only."""
    result = await db.execute(select(User))
    return result.scalars().all()


@router.post("/")
async def create_user(
    payload: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Create a new user. Admin only."""
    # Validate role
    if payload.role not in ("admin", "farmer"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'farmer'")

    # Validate password strength
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": "User created", "user_id": new_user.id}


@router.delete("/{user_id}")
async def delete_user(
    user_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Delete a user. Admin only. Cannot delete yourself."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int = Path(..., gt=0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Reset a user's password. Admin only. Cannot reset own password."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot reset your own password through this endpoint")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate temp password: 2 uppercase + 2 lowercase + 2 digits + 4 random
    upper = "".join(secrets.choice(string.ascii_uppercase) for _ in range(2))
    lower = "".join(secrets.choice(string.ascii_lowercase) for _ in range(2))
    digits = "".join(secrets.choice(string.digits) for _ in range(2))
    rest = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(4))
    # Shuffle to avoid predictable pattern
    temp_chars = list(upper + lower + digits + rest)
    secrets.SystemRandom().shuffle(temp_chars)
    temp_password = "".join(temp_chars)

    user.hashed_password = get_password_hash(temp_password)
    await db.commit()

    return {"temporary_password": temp_password}


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
