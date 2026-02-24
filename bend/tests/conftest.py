"""
Pytest configuration and fixtures for testing.
"""
import os

# Override database URL BEFORE any app modules are imported.
# This prevents the module-level engine from trying to load asyncpg.
os.environ["database-url"] = "sqlite+aiosqlite:///:memory:"

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.core.database import get_db, Base
from app.core.security import get_password_hash, create_access_token
from app.core import security as security_module
from app.models.user import User
from app.models.product import Product, Farmer
from app.models.order import Order, OrderItem

# Use SQLite for testing (in-memory)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables after test
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session_maker() as session:
        yield session


@pytest_asyncio.fixture
async def client(test_session) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with overridden database dependency."""

    async def override_get_db():
        yield test_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_admin(test_session) -> User:
    """Create a test admin user."""
    admin = User(
        email="admin@test.com",
        hashed_password=get_password_hash("TestPass123"),
        role="admin",
    )
    test_session.add(admin)
    await test_session.commit()
    await test_session.refresh(admin)
    return admin


@pytest_asyncio.fixture
async def test_farmer_user(test_session, test_farmer) -> User:
    """Create a test farmer user."""
    farmer_user = User(
        email="farmer@test.com",
        hashed_password=get_password_hash("TestPass123"),
        role="farmer",
        farmer_id=test_farmer.id,
    )
    test_session.add(farmer_user)
    await test_session.commit()
    await test_session.refresh(farmer_user)
    return farmer_user


@pytest_asyncio.fixture
async def test_farmer(test_session) -> Farmer:
    """Create a test farmer."""
    farmer = Farmer(
        name="Test Farmer",
        location="Test Location",
        bio="Test bio",
    )
    test_session.add(farmer)
    await test_session.commit()
    await test_session.refresh(farmer)
    return farmer


@pytest_asyncio.fixture
async def test_product(test_session, test_farmer) -> Product:
    """Create a test product."""
    product = Product(
        name="Test Tomatoes",
        price=50.0,
        stock_qty=100,
        unit="kg",
        farmer_id=test_farmer.id,
    )
    test_session.add(product)
    await test_session.commit()
    await test_session.refresh(product)
    return product


@pytest.fixture
def admin_token(test_admin) -> str:
    """Generate a valid admin JWT token."""
    return create_access_token(
        data={"sub": test_admin.email, "role": test_admin.role}
    )


@pytest.fixture
def farmer_token(test_farmer_user) -> str:
    """Generate a valid farmer JWT token."""
    return create_access_token(
        data={"sub": test_farmer_user.email, "role": test_farmer_user.role}
    )


@pytest_asyncio.fixture
async def test_order(test_session, test_product) -> Order:
    """Create a test order with one item."""
    order = Order(
        customer_name="Test Customer",
        customer_email="customer@test.com",
        address="123 Test Street, Test City",
        total_price=100.0,
        status="pending",
    )
    test_session.add(order)
    await test_session.flush()

    order_item = OrderItem(
        order_id=order.id,
        product_id=test_product.id,
        quantity=2,
        price_at_time=50.0,
    )
    test_session.add(order_item)
    await test_session.commit()
    await test_session.refresh(order)
    return order


@pytest.fixture(autouse=True)
def clear_token_blacklist():
    """Clear the in-memory token blacklist between tests."""
    security_module._token_blacklist.clear()
    yield
    security_module._token_blacklist.clear()


def auth_header(token: str) -> dict:
    """Create authorization header."""
    return {"Authorization": f"Bearer {token}"}
