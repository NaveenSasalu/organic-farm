from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional
from datetime import datetime, date
from .enums import OrderStatus


class OrderItemCreate(BaseModel):
    """Schema for creating order items."""
    product_id: int = Field(..., gt=0, description="Product ID must be positive")
    quantity: int = Field(..., ge=1, le=1000, description="Quantity must be between 1 and 1000")
    price: float = Field(..., ge=0, description="Price cannot be negative")


class OrderCreate(BaseModel):
    """Schema for creating orders."""
    customer_name: str = Field(..., min_length=2, max_length=100, description="Customer name")
    customer_email: EmailStr = Field(..., description="Valid email address required")
    address: str = Field(..., min_length=10, max_length=500, description="Delivery address")
    total_price: float = Field(..., ge=0, description="Total price cannot be negative")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="At least one item required")

    @field_validator('customer_name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Strip whitespace and validate name."""
        v = v.strip()
        if not v:
            raise ValueError("Customer name cannot be empty")
        return v

    @field_validator('address')
    @classmethod
    def validate_address(cls, v: str) -> str:
        """Strip whitespace and validate address."""
        v = v.strip()
        if not v:
            raise ValueError("Address cannot be empty")
        return v


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status."""
    status: OrderStatus = Field(..., description="New order status")


class OrderItemResponse(BaseModel):
    """Schema for order item response."""
    id: int
    product_id: int
    quantity: int
    price_at_time: float
    is_harvested: bool

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: int
    customer_name: str
    customer_email: str
    address: str
    total_price: float
    status: str
    created_at: datetime
    delivery_date: Optional[date] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
