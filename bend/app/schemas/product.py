from pydantic import BaseModel, Field, field_validator
from typing import Optional


class ProductBase(BaseModel):
    """Base product schema with validation."""
    name: str = Field(..., min_length=2, max_length=100, description="Product name")
    price: float = Field(..., ge=0, le=100000, description="Price must be non-negative")
    unit: str = Field(..., min_length=1, max_length=20, description="Unit of measurement")
    is_organic: bool = Field(default=True, description="Is product organic")
    stock_qty: float = Field(..., ge=0, le=1000000, description="Stock quantity must be non-negative")

    @field_validator('name', 'unit')
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Strip whitespace from string fields."""
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty")
        return v


class ProductCreate(ProductBase):
    """Schema for creating products."""
    farmer_id: int = Field(..., gt=0, description="Farmer ID must be positive")


class ProductUpdate(BaseModel):
    """Schema for updating products (all fields optional)."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    price: Optional[float] = Field(None, ge=0, le=100000)
    unit: Optional[str] = Field(None, min_length=1, max_length=20)
    is_organic: Optional[bool] = None
    stock_qty: Optional[float] = Field(None, ge=0, le=1000000)


class ProductResponse(ProductBase):
    """Schema for product response."""
    id: int
    farmer_id: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# Alias for backward compatibility
Product = ProductResponse
