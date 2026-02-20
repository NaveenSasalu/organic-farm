import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from .enums import UserRole


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr = Field(..., description="Valid email address")


class UserCreate(UserBase):
    """Schema for creating users."""
    password: str = Field(..., min_length=8, max_length=128, description="Password")
    role: UserRole = Field(default=UserRole.FARMER, description="User role")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        Validate password strength:
        - At least 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit
        """
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    role: str
    farmer_id: Optional[int] = None

    class Config:
        from_attributes = True


class FarmerCreate(BaseModel):
    """Schema for creating farmers (used with form data validation)."""
    name: str = Field(..., min_length=2, max_length=100, description="Farmer name")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password")
    location: str = Field(..., min_length=5, max_length=200, description="Farm location")
    bio: str = Field(..., min_length=10, max_length=1000, description="Farmer bio")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator('name', 'location')
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Strip whitespace from string fields."""
        return v.strip()


class LoginRequest(BaseModel):
    """Schema for login request."""
    username: EmailStr = Field(..., description="Email address")  # Named username for OAuth2 compatibility
    password: str = Field(..., min_length=1, description="Password")


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
