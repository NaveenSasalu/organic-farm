from sqlalchemy import String, Float, Integer, ForeignKey, DateTime, Date, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, date
from app.models.product import Product
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        # Indexes for common queries
        Index("ix_orders_customer_email", "customer_email"),
        Index("ix_orders_status", "status"),
        Index("ix_orders_created_at", "created_at"),
        # Constraints
        CheckConstraint("total_price >= 0", name="chk_orders_total_price_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    # Relationship to items (cascade delete when order is deleted)
    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        # Indexes for common queries
        Index("ix_order_items_order_id", "order_id"),
        Index("ix_order_items_product_id", "product_id"),
        # Constraints
        CheckConstraint("quantity > 0", name="chk_order_items_quantity_positive"),
        CheckConstraint("price_at_time >= 0", name="chk_order_items_price_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_time: Mapped[float] = mapped_column(Float, nullable=False)
    is_harvested: Mapped[bool] = mapped_column(default=False, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product")