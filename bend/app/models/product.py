from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Boolean, Integer, ForeignKey, Text, CheckConstraint, Index
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        # Indexes for common queries
        Index("ix_products_farmer_id", "farmer_id"),
        Index("ix_products_name", "name"),
        # Constraints
        CheckConstraint("price >= 0", name="chk_products_price_positive"),
        CheckConstraint("stock_qty >= 0", name="chk_products_stock_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    stock_qty: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_organic: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)

    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("farmers.id", ondelete="CASCADE"),
        nullable=False
    )
    farmer: Mapped["Farmer"] = relationship("Farmer", back_populates="products")


class Farmer(Base):
    __tablename__ = "farmers"
    __table_args__ = (
        Index("ix_farmers_name", "name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    profile_pic: Mapped[str] = mapped_column(String(255), nullable=True)

    # Link to products (cascade delete when farmer is deleted)
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="farmer",
        cascade="all, delete-orphan"
    )

