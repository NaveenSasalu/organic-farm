import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# 1. Create the Async Engine
# We use 'postgresql+asyncpg' to use the asynchronous driver
# Only enable SQL logging in development mode
is_development = os.getenv("ENVIRONMENT", "development") == "development"

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=is_development,  # Only log SQL in development
    future=True,
    pool_pre_ping=True,  # Verify connections before use
    pool_size=10,  # Connection pool size
    max_overflow=20,  # Max connections beyond pool_size
)

# 2. Create a Session factory
# This is what we use to create new database sessions in our routes
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# 3. Create the Declarative Base
# All your models (User, Product, etc.) must inherit from this class
class Base(DeclarativeBase):
    pass

# 4. Dependency to get a DB session (used in FastAPI routes)
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()