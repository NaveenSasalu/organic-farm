from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.db.session import get_db
from app.models.product import Product as ProductModel
from app.schemas.product import Product as ProductSchema
from fastapi import UploadFile, File, Form
from typing import Optional
from app.utils.storage import upload_to_minio

router = APIRouter()

@router.get("/", response_model=List[ProductSchema])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductModel).filter(ProductModel.stock_qty > 0))
    products = result.scalars().all()
    return products

@router.post("/")
async def create_or_update_product(
    id: Optional[int] = Form(None),
    name: str = Form(...),
    price: float = Form(...),
    stock_qty: int = Form(...),
    unit: str = Form(...),
    farmer_id: int = Form(...),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    image_url = None
    if file:
        # Reuse your MinIO upload logic here
        image_url = await upload_to_minio(file)

    if id: # UPDATE EXISTING
        result = await db.execute(select(Product).where(Product.id == id))
        product = result.scalar_one()
        product.name = name
        product.price = price
        product.stock_qty = stock_qty
        product.farmer_name = farmer_name
        if image_url: product.image_url = image_url
    else: # CREATE NEW
        product = Product(
            name=name, price=price, stock_qty=stock_qty, 
            unit=unit, farmer_id=farmer_id, image_url=image_url
        )
        db.add(product)
    
    await db.commit()
    return {"status": "success"}

@router.patch("/{product_id}/stock")
async def update_stock(product_id: int, qty: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.stock_qty = qty
    await db.commit()
    return {"status": "success", "new_qty": product.stock_qty}



@router.post("/upsert")
async def upsert_product(
    id: Optional[int] = Form(None), # If ID exists, we update. Otherwise, we create.
    name: str = Form(...),
    price: float = Form(...),
    stock_qty: int = Form(...),
    unit: str = Form(...),
    farmer_id: int = Form(...),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    image_url = None
    if file:
        # Assuming your previous MinIO upload function is available
        image_url = await upload_to_minio(file)

    if id:  # --- UPDATE LOGIC ---
        result = await db.execute(select(Product).where(Product.id == id))
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product.name = name
        product.price = price
        product.stock_qty = stock_qty
        product.unit = unit
        product.farmer_id = farmer_id
        if image_url:
            product.image_url = image_url
            
    else:  # --- CREATE LOGIC ---
        product = Product(
            name=name,
            price=price,
            stock_qty=stock_qty,
            unit=unit,
            farmer_id=farmer_id,
            image_url=image_url
        )
        db.add(product)

    await db.commit()
    return {"status": "success", "product_id": product.id}