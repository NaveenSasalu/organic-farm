from fastapi import APIRouter, Depends
from typing import List
from app.schemas.product import Product

router = APIRouter()

@router.get("/", response_model=List[Product])
async def get_harvest():
    # Later this will call your Postgres DB
    return [
        {"id": 1, "name": "Organic Spinach", "price": 3.5, "unit": "bunch", "stock_qty": 10},
        {"id": 2, "name": "Organic Carrots", "price": 2.0, "unit": "kg", "stock_qty": 50}
    ]
