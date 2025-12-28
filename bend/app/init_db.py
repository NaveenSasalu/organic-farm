import asyncio
from sqlalchemy.ext.asyncio import create_async_engine # added additionally - Nk
from sqlalchemy import String, Boolean, Integer
from app.models.product import Base
from app.models.order import Base
from app.core.config import settings

async def init_models():
    # settings.DATABASE_URL must be pointing to your localhost Postgres
    engine = create_async_engine(settings.DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        # This line looks at your "Base" and creates all tables 
        # defined in your models/ folder.
        print("--- Initializing Database Tables ---")
        await conn.run_sync(Base.metadata.create_all)
        print("--- Database Sync Complete ---")

if __name__ == "__main__":
    asyncio.run(init_models())
