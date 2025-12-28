from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    name: str
    price: float
    unit: str  # e.g., "kg", "bunch"
    is_organic: bool = True
    stock_qty: float

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    image_url: Optional[str] = None

    class Config:
        from_attributes = True # Allows Pydantic to read SQLAlchemy models
