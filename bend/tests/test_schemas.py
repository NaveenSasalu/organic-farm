"""
Unit tests for Pydantic schemas — OrderCreate, OrderItemCreate, OrderStatus enum.
"""
import pytest
from pydantic import ValidationError

from app.schemas.order import OrderCreate, OrderItemCreate
from app.schemas.enums import OrderStatus


# ─── OrderCreate ───────────────────────────────────────────

def _valid_order_data(**overrides):
    """Return valid OrderCreate dict with optional overrides."""
    data = {
        "customer_name": "Test Customer",
        "customer_email": "customer@test.com",
        "address": "123 Test Street, Test City, 12345",
        "total_price": 100.0,
        "items": [{"product_id": 1, "quantity": 2, "price": 50.0}],
    }
    data.update(overrides)
    return data


def test_order_create_valid():
    """Valid OrderCreate should parse without error."""
    order = OrderCreate(**_valid_order_data())
    assert order.customer_name == "Test Customer"
    assert len(order.items) == 1


def test_order_create_name_too_short():
    """customer_name with 1 char should fail min_length=2."""
    with pytest.raises(ValidationError):
        OrderCreate(**_valid_order_data(customer_name="A"))


def test_order_create_name_whitespace_only():
    """Whitespace-only customer_name stripped to empty should fail validator."""
    with pytest.raises(ValidationError):
        OrderCreate(**_valid_order_data(customer_name="   "))


def test_order_create_address_too_short():
    """Address shorter than 10 chars should fail."""
    with pytest.raises(ValidationError):
        OrderCreate(**_valid_order_data(address="Short"))


def test_order_create_empty_items():
    """Empty items list should fail min_length=1."""
    with pytest.raises(ValidationError):
        OrderCreate(**_valid_order_data(items=[]))


def test_order_create_negative_total_price():
    """Negative total_price should fail ge=0."""
    with pytest.raises(ValidationError):
        OrderCreate(**_valid_order_data(total_price=-10.0))


# ─── OrderItemCreate ──────────────────────────────────────

def test_order_item_create_valid():
    """Valid OrderItemCreate should parse without error."""
    item = OrderItemCreate(product_id=1, quantity=5, price=25.0)
    assert item.product_id == 1
    assert item.quantity == 5


def test_order_item_product_id_zero():
    """product_id=0 should fail gt=0."""
    with pytest.raises(ValidationError):
        OrderItemCreate(product_id=0, quantity=1, price=10.0)


def test_order_item_quantity_zero():
    """quantity=0 should fail ge=1."""
    with pytest.raises(ValidationError):
        OrderItemCreate(product_id=1, quantity=0, price=10.0)


def test_order_item_quantity_exceeds_max():
    """quantity=1001 should fail le=1000."""
    with pytest.raises(ValidationError):
        OrderItemCreate(product_id=1, quantity=1001, price=10.0)


def test_order_item_negative_price():
    """Negative price should fail ge=0."""
    with pytest.raises(ValidationError):
        OrderItemCreate(product_id=1, quantity=1, price=-5.0)


# ─── OrderStatus Enum ─────────────────────────────────────

def test_order_status_enum_values():
    """OrderStatus should have exactly 5 values."""
    expected = {"pending", "confirmed", "packed", "delivered", "cancelled"}
    actual = {s.value for s in OrderStatus}
    assert actual == expected
