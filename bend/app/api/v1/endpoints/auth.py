import re
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    authenticate_user,
    blacklist_token,
    get_password_hash,
    ALGORITHM,
)
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

# Import limiter (will be no-op if slowapi not installed)
try:
    from app.middleware.rate_limit import limiter
except ImportError:
    from functools import wraps
    class NoOpLimiter:
        def limit(self, limit_string):
            def decorator(func):
                return func
            return decorator
    limiter = NoOpLimiter()

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


class LoginRequest(BaseModel):
    username: EmailStr  # Email field (named username for OAuth2 compatibility)
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    farmer_id: int | None = None

    class Config:
        from_attributes = True


@router.post("/register")
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Public user registration. Creates a user with 'farmer' role."""
    # Validate name
    name = payload.name.strip()
    if not name or len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")

    # Validate password strength
    password = payload.password
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r'[A-Z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r'\d', password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit")

    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=payload.email,
        hashed_password=get_password_hash(password),
        role="farmer",
    )
    db.add(new_user)
    await db.commit()

    # Auto-login: return token
    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role,
        "email": new_user.email,
    }


@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT token.

    Rate limited to 5 requests per minute to prevent brute force attacks.
    """
    logger.info(f"Login attempt for email: {payload.username}")

    user = await authenticate_user(db, payload.username, payload.password)
    if not user:
        logger.warning(f"Failed login attempt for email: {payload.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role})

    logger.info(f"Successful login for email: {payload.username}, role: {user.role}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
    }


@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """
    Logout user by blacklisting their token.

    The token will be invalidated and cannot be used again.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        exp_timestamp = payload.get("exp")
        email = payload.get("sub", "unknown")

        if exp_timestamp:
            exp_time = datetime.utcfromtimestamp(exp_timestamp)
            blacklist_token(token, exp_time)
            logger.info(f"User logged out: {email}")
    except JWTError:
        pass  # Token invalid anyway, no need to blacklist

    return {"detail": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get the current authenticated user's information.

    Used to validate token and sync auth state.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        farmer_id=current_user.farmer_id,
    )