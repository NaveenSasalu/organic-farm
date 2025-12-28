from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token
from sqlalchemy import select

router = APIRouter()

@router.post("/login")
async def login(
    response: Response, 
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch User
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    # 2. Validate Password
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 3. Create Token
    token = create_access_token(data={"sub": user.email, "role": user.role})

    # 4. Set HttpOnly Cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,   # Critical for security
        max_age=86400,   # 24 hours
        samesite="lax",
        #secure=False,    # Change to True when using HTTPS
        # for prodcution
        secure=True,     # MUST be True in production for HTTPS
        domain=".kaayaka.in" # Allows subdomains to share the cookie if needed
    )

    return {"status": "success", "role": user.role}

@router.post("/logout")
async def logout(response: Response):
    # This clears the HttpOnly cookie by setting its expiry to the past
    response.delete_cookie(
        key="auth_token",
        path="/",
        httponly=True,
        samesite="lax",
    )
    return {"status": "success", "message": "Logged out"}