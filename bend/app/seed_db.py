import asyncio
from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal # Use shared config
from app.models.product import Product, Farmer
from app.core.config import settings

async def seed_data():
    # Use the session factory from your core database file
    async with AsyncSessionLocal() as session:
        # async with session.begin() starts a transaction and commits on exit
        async with session.begin():
            # 1. Check for the farmer created by initial_data.py
            result = await session.execute(select(Farmer).limit(1))
            first_farmer = result.scalar_one_or_none()
            
            if not first_farmer:
                print("❌ No farmers found. Please run initial_data.py first!")
                return

            # 2. Check if products already exist (Idempotency)
            existing_product = await session.execute(select(Product).limit(1))
            if existing_product.scalar_one_or_none():
                print("⏭️ Products already exist. Skipping seed.")
                return

            # 3. Create items linked to the farmer
            items = [
                Product(
                    name="Organic Alphonso Mango", 
                    price=15.0, 
                    unit="kg", 
                    stock_qty=50, 
                    is_organic=True,
                    farmer_id=first_farmer.id
                ),
                Product(
                    name="Farm Fresh Spinach", 
                    price=2.5, 
                    unit="bunch", 
                    stock_qty=30, 
                    is_organic=True,
                    farmer_id=first_farmer.id
                ),
                Product(
                    name="Heirloom Carrots", 
                    price=3.0, 
                    unit="kg", 
                    stock_qty=100, 
                    is_organic=True,
                    farmer_id=first_farmer.id
                ),
            ]
            
            session.add_all(items)
            print(f"🌱 Seed data added and linked to Farmer: {first_farmer.name}")

    # Explicitly close all connections in the pool before the script exits
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_data())