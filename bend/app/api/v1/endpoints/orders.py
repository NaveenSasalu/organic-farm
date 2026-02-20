import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import EmailStr
from typing import Optional
from app.core.database import get_db
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.order import OrderCreate, OrderItemCreate
from app.schemas.enums import OrderStatus
from app.utils.pagination import PaginationParams

logger = logging.getLogger(__name__)

# Import limiter (will be no-op if slowapi not installed)
try:
    from app.middleware.rate_limit import limiter
except ImportError:
    class NoOpLimiter:
        def limit(self, limit_string):
            def decorator(func):
                return func
            return decorator
    limiter = NoOpLimiter()
router = APIRouter()


@router.get("/")
async def get_orders(
    status: Optional[OrderStatus] = None,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get orders with pagination. Admins see all, farmers see only their products."""
    # Base query with eager loading
    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.farmer)
    )

    if status:
        query = query.where(Order.status == status.value)

    # Logic for Farmers (Siloed View)
    if current_user.role == "farmer":
        query = query.join(OrderItem).join(Product).where(Product.farmer_id == current_user.farmer_id)

        # Get total count for pagination
        count_query = select(func.count(func.distinct(Order.id))).select_from(Order).join(OrderItem).join(Product).where(Product.farmer_id == current_user.farmer_id)
        if status:
            count_query = count_query.where(Order.status == status.value)
        total = (await db.execute(count_query)).scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(Order.created_at.desc()).offset(offset).limit(page_size)
        result = await db.execute(query)
        orders = result.scalars().unique().all()

        # Strip out items that don't belong to this farmer
        for order in orders:
            order.items = [item for item in order.items if item.product.farmer_id == current_user.farmer_id]

        return {
            "items": orders,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0
        }

    # Logic for Admins (Master View)
    count_query = select(func.count()).select_from(Order)
    if status:
        count_query = count_query.where(Order.status == status.value)
    total = (await db.execute(count_query)).scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Order.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().unique().all()

    return {
        "items": orders,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0
    }


@router.patch("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch order with items and products
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "cancelled":
        raise HTTPException(status_code=400, detail="Order already cancelled")

    if order.status == "delivered":
        raise HTTPException(status_code=400, detail="Cannot cancel delivered order")

    # Restore stock for each item
    for item in order.items:
        product = item.product
        product.stock_qty += item.quantity

    order.status = "cancelled"
    await db.commit()
    return {"status": "cancelled", "message": "Stock restored"}


@router.post("/")
async def create_order(order_data: OrderCreate, db: AsyncSession = Depends(get_db)):
    """Create a new order. Validates stock availability and reduces stock."""
    try:
        # Check and Update Stock for each item
        for item in order_data.items:
            product_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = product_result.scalar_one_or_none()

            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

            if product.stock_qty < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Only {product.stock_qty} {product.unit} of {product.name} left!"
                )

            # Reduce stock
            product.stock_qty -= item.quantity

        # Create the Main Order
        new_order = Order(
            customer_name=order_data.customer_name,
            customer_email=order_data.customer_email,
            address=order_data.address,
            total_price=order_data.total_price
        )
        db.add(new_order)
        await db.flush()

        # Create the OrderItems
        for item in order_data.items:
            db.add(OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_time=item.price
            ))

        await db.commit()
        return {"status": "success", "order_id": new_order.id}

    except HTTPException:
        await db.rollback()
        raise
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error(f"Database error creating order: {e}")
        raise HTTPException(status_code=500, detail="Failed to create order. Please try again.")
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error creating order: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: OrderStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order status. Admin only."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status.value
    await db.commit()
    return {"status": "updated", "new_status": order.status}


@router.patch("/items/{item_id}/harvest")
async def mark_item_harvested(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark an order item as harvested by the farmer."""
    # Fetch the order item with product and order info
    result = await db.execute(
        select(OrderItem)
        .options(selectinload(OrderItem.product), selectinload(OrderItem.order))
        .where(OrderItem.id == item_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Order item not found")

    # Verify farmer owns this product
    if current_user.role == "farmer":
        if item.product.farmer_id != current_user.farmer_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this item")

    item.is_harvested = True

    # Check if ALL items in this order are now harvested
    order_result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == item.order_id)
    )
    order = order_result.scalar_one()

    all_harvested = all(i.is_harvested for i in order.items)

    # Auto-update order status to "packed" when all items are harvested
    if all_harvested and order.status == "pending":
        order.status = "packed"

    await db.commit()

    return {
        "status": "harvested",
        "item_id": item_id,
        "order_status": order.status,
        "all_items_harvested": all_harvested
    }


@router.get("/farmer-items")
async def get_farmer_order_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all order items for the current farmer's products."""
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can access this endpoint")

    if not current_user.farmer_id:
        raise HTTPException(status_code=403, detail="Farmer profile not linked")

    # Query order items where the product belongs to this farmer
    query = (
        select(OrderItem)
        .options(selectinload(OrderItem.product), selectinload(OrderItem.order))
        .join(Product)
        .where(Product.farmer_id == current_user.farmer_id)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/track")
@limiter.limit("10/minute")
async def track_order(
    request: Request,
    order_id: int = Query(..., gt=0, description="Order ID"),
    email: EmailStr = Query(..., description="Customer email"),
    db: AsyncSession = Depends(get_db)
):
    """
    PUBLIC ENDPOINT - Track order by ID and email.
    Returns order details including items and their harvest status.

    Rate limited to 10 requests per minute to prevent abuse.
    """
    logger.info(f"Order track request for order_id={order_id}")

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.id == order_id, Order.customer_email == email)
    )
    order = result.scalar_one_or_none()

    if not order:
        # Generic message to prevent order enumeration
        logger.warning(f"Order track failed: order_id={order_id} not found or email mismatch")
        raise HTTPException(status_code=404, detail="Order not found")

    return order
