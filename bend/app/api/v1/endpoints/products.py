import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from typing import Optional
from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductResponse
from app.utils.storage import upload_to_minio
from app.models.user import User
from app.api.deps import get_current_user, get_current_admin

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

# Import file validation (optional)
try:
    from app.utils.file_validation import validate_image_upload, ALLOWED_IMAGE_TYPES
    FILE_VALIDATION_ENABLED = True
except ImportError:
    FILE_VALIDATION_ENABLED = False
    logger.warning("File validation not available - python-magic may not be installed")
router = APIRouter()


@router.get("/")
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get products with pagination. Farmers see only their products."""
    query = select(Product).options(joinedload(Product.farmer))
    count_query = select(func.count()).select_from(Product)

    if current_user.role == "farmer":
        if not current_user.farmer_id:
            raise HTTPException(status_code=403, detail="Farmer profile not linked")
        query = query.where(Product.farmer_id == current_user.farmer_id)
        count_query = count_query.where(Product.farmer_id == current_user.farmer_id)

    # Get total count
    total = (await db.execute(count_query)).scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.order_by(Product.id.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    products = result.scalars().unique().all()

    return {
        "items": products,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0
    }


@router.get("/public")
@limiter.limit("30/minute")
async def get_public_products(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """
    PUBLIC ENDPOINT - Intentionally unauthenticated for storefront browsing.
    Returns all products with farmer info for the public catalog.

    Rate limited to 30 requests per minute.
    """
    # Get total count
    count_query = select(func.count()).select_from(Product)
    total = (await db.execute(count_query)).scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = (
        select(Product)
        .options(joinedload(Product.farmer))
        .order_by(Product.id.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    products = result.scalars().all()

    return {
        "items": products,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if page_size > 0 else 0
    }

# Removed duplicate endpoint - using the authenticated version above

@router.patch("/{product_id}/stock")
async def update_stock(
    product_id: int,
    qty: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update product stock. Farmers can only update their own products."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Farmers can only update their own products
    if current_user.role == "farmer":
        if product.farmer_id != current_user.farmer_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this product")

    if qty < 0:
        raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")

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
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update a product. Farmers can only manage their own products."""

    # Validate inputs
    if price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative")
    if stock_qty < 0:
        raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")

    # Authorization: Farmers can only manage their own products
    if current_user.role == "farmer":
        if farmer_id != current_user.farmer_id:
            raise HTTPException(status_code=403, detail="Farmers can only manage their own products")

    # Check if we are updating an existing product
    product = None
    if id:
        product = await db.get(Product, id)
        if product and current_user.role == "farmer":
            if product.farmer_id != current_user.farmer_id:
                raise HTTPException(status_code=403, detail="Not authorized to update this product")

    # Handle the Image Logic
    image_url = product.image_url if product else None

    # ONLY upload and update if a NEW file is provided
    if file and file.filename:
        # Validate file before upload (if validation is available)
        if FILE_VALIDATION_ENABLED:
            try:
                contents, mime_type = await validate_image_upload(file)
                logger.info(f"Image validated: {file.filename} ({mime_type})")
                # Reset file position after validation read
                await file.seek(0)
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Image validation failed: {e}")
                raise HTTPException(status_code=400, detail="Invalid image file")

        image_url = await upload_to_minio(file)

    if product:
        # UPDATE existing
        product.name = name
        product.price = price
        product.stock_qty = stock_qty
        product.unit = unit
        product.farmer_id = farmer_id
        product.image_url = image_url
    else:
        # CREATE new
        new_product = Product(
            name=name, price=price, stock_qty=stock_qty,
            unit=unit, farmer_id=farmer_id, image_url=image_url
        )
        db.add(new_product)

    await db.commit()
    return {"message": "Success"}
