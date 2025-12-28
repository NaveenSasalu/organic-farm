from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.order import Order, OrderItem
from pydantic import BaseModel
from typing import List
from typing import Optional

from sqlalchemy import select, selectinload, update
from app.models.product import Product # Ensure this is imported

router = APIRouter()

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    price: float

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    address: str
    total_price: float
    items: List[OrderItemCreate]

@router.get("/")
async def get_orders(
    status: Optional[str] = None,
    farmer_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).options(
        selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.farmer)
    )
    
    if status:
        query = query.where(Order.status == status)
    
    # Filter orders that contain at least one item from a specific farmer
    if farmer_id:
        query = query.join(OrderItem).join(Product).where(Product.farmer_id == farmer_id)

    result = await db.execute(query.order_by(Order.delivery_date.asc()))
    return result.scalars().unique().all()

@router.patch("/{order_id}/cancel")
async def cancel_order(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order:
        order.status = "cancelled"
        await db.commit()
    return {"status": "cancelled"}


@router.patch("/{order_id}/status")
async def update_order_status(order_id: int, status: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status
    await db.commit()
    return {"status": "updated", "new_status": order.status}

@router.post("/")
async def create_order(order_data: OrderCreate, db: AsyncSession = Depends(get_db)):
    # 1. Start the transaction logic
    try:
        # 2. Check and Update Stock for each item
        for item in order_data.items:
            # Fetch current stock
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

        # 3. Create the Main Order (after stock check passes)
        new_order = Order(
            customer_name=order_data.customer_name,
            customer_email=order_data.customer_email,
            address=order_data.address,
            total_price=order_data.total_price
        )
        db.add(new_order)
        await db.flush() 

        # 4. Create the OrderItems
        for item in order_data.items:
            db.add(OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_time=item.price
            ))
        
        await db.commit()
        return {"status": "success", "order_id": new_order.id}

    except Exception as e:
        await db.rollback() # Important: Cancel everything if anything fails
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))