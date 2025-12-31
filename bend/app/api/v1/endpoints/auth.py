from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import create_access_token, authenticate_user

router = APIRouter()

# 1. Define the JSON schema
class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Authenticate using the JSON data
    user = await authenticate_user(db, payload.username, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Create the JWT
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email
    }

@router.post("/logout")
async def logout():
    # In JWT, logout is primarily handled by the client. 
    # This endpoint can be used if you implement a token blacklist.
    return {"detail": "Successfully logged out"}