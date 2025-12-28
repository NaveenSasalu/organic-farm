import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models.product import Product
from app.core.config import settings

async def seed_data():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        # We use session.begin() to ensure the transaction commits at the end
        async with session.begin():
            items = [
                Product(name="Organic Alphonso Mango", price=15.0, unit="kg", stock_qty=50, is_organic=True),
                Product(name="Farm Fresh Spinach", price=2.5, unit="bunch", stock_qty=30, is_organic=True),
                Product(name="Heirloom Carrots", price=3.0, unit="kg", stock_qty=100, is_organic=True),
                Product(name="Wildflower Honey", price=12.0, unit="500g", stock_qty=15, is_organic=True),
                Product(name="Organic Brown Eggs", price=5.5, unit="dozen", stock_qty=20, is_organic=True),
            ]
            session.add_all(items)
        print("🌱 Seed data added successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())