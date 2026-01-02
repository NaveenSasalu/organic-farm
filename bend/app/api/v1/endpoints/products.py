from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.db.session import get_db
from app.models.product import Product, Product as ProductModel
from app.schemas.product import Product as ProductSchema
from fastapi import UploadFile, File, Form
from typing import Optional
from app.utils.storage import upload_to_minio
from sqlalchemy.orm import joinedload
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/")
async def get_products(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Base query
    query = select(Product)
    
    # If the logged-in user is a farmer, filter by their specific ID
    if current_user.role == "farmer":
        if not current_user.farmer_id:
            raise HTTPException(status_code=403, detail="Farmer profile not linked")
        query = query.where(Product.farmer_id == current_user.farmer_id)
    
    # Admins see everything, so no 'where' clause is added for them
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/all")
async def get_products(db: AsyncSession = Depends(get_db)):
    # This fetches products AND their associated farmer info in one go
    result = await db.execute(
        select(Product).options(joinedload(Product.farmer)).order_by(Product.id.desc())
    )
    return result.scalars().all()

@router.get("/", response_model=List[ProductSchema])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductModel).filter(ProductModel.stock_qty > 0))
    products = result.scalars().all()
    return products

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
    id: Optional[int] = Form(None),
    name: str = Form(...),
    price: float = Form(...),
    stock_qty: int = Form(...),
    unit: str = Form(...),
    farmer_id: int = Form(...),
    file: Optional[UploadFile] = File(None), # The file from the form
    db: AsyncSession = Depends(get_db)
):
    # 1. Check if we are updating an existing product
    product = None
    if id:
        product = await db.get(Product, id)

    # 2. Handle the Image Logic
    image_url = product.image_url if product else None # Keep existing by default

    # ONLY upload and update if a NEW file is provided
    if file and file.filename: 
        image_url = await upload_to_minio(file)

    if product:
        # UPDATE existing
        product.name = name
        product.price = price
        product.stock_qty = stock_qty
        product.unit = unit
        product.farmer_id = farmer_id
        product.image_url = image_url # Will be the new URL or the old one kept above
    else:
        # CREATE new
        new_product = Product(
            name=name, price=price, stock_qty=stock_qty, 
            unit=unit, farmer_id=farmer_id, image_url=image_url
        )
        db.add(new_product)

    await db.commit()
    return {"message": "Success"}

# @router.post("/upsert")
# async def upsert_product(
#     id: Optional[int] = Form(None), # If ID exists, we update. Otherwise, we create.
#     name: str = Form(...),
#     price: float = Form(...),
#     stock_qty: int = Form(...),
#     unit: str = Form(...),
#     farmer_id: int = Form(...),
#     file: Optional[UploadFile] = File(None),
#     db: AsyncSession = Depends(get_db)
# ):
#     image_url = None
#     if file:
#         # Assuming your previous MinIO upload function is available
#         image_url = await upload_to_minio(file)

#     if id:  # --- UPDATE LOGIC ---
#         result = await db.execute(select(Product).where(Product.id == id))
#         product = result.scalar_one_or_none()
#         if not product:
#             raise HTTPException(status_code=404, detail="Product not found")

#         product.name = name
#         product.price = price
#         product.stock_qty = stock_qty
#         product.unit = unit
#         product.farmer_id = farmer_id
#         if image_url:
#             product.image_url = image_url

#     else:  # --- CREATE LOGIC ---
#         product = Product(
#             name=name,
#             price=price,
#             stock_qty=stock_qty,
#             unit=unit,
#             farmer_id=farmer_id,
#             image_url=image_url
#         )
#         db.add(product)

#     await db.commit()
#     return {"status": "success", "product_id": product.id}
