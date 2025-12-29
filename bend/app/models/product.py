from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, Boolean, Integer, ForeignKey
from sqlalchemy import Column, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base # Import from the new file

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20))
    stock_qty: Mapped[float] = mapped_column(Float, default=0.0)
    # FIXED LINE BELOW: Added Mapped[bool]
    is_organic: Mapped[bool] = mapped_column(Boolean, default=True)
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)

    farmer_id: Mapped[int] = mapped_column(ForeignKey("farmers.id"))
    farmer: Mapped["Farmer"] = relationship("Farmer", back_populates="products")

class Farmer(Base):
    __tablename__ = "farmers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(100)) # e.g., "Yelahanka, Bengaluru"
    profile_pic: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Link to products
    products: Mapped[list["Product"]] = relationship("Product", back_populates="farmer")

