"""
Tests for order endpoints.
"""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_create_order(client: AsyncClient, test_product):
    """Test creating a new order."""
    order_data = {
        "customer_name": "Test Customer",
        "customer_email": "customer@test.com",
        "address": "123 Test Street, Test City",
        "total_price": 100.0,
        "items": [
            {
                "product_id": test_product.id,
                "quantity": 2,
                "price": 50.0
            }
        ]
    }

    response = await client.post(
        "/api/v1/orders/",
        json=order_data
    )

    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data


@pytest.mark.asyncio
async def test_create_order_invalid_email(client: AsyncClient, test_product):
    """Test creating order with invalid email fails."""
    order_data = {
        "customer_name": "Test Customer",
        "customer_email": "invalid-email",
        "address": "123 Test Street",
        "total_price": 100.0,
        "items": [
            {
                "product_id": test_product.id,
                "quantity": 2,
                "price": 50.0
            }
        ]
    }

    response = await client.post(
        "/api/v1/orders/",
        json=order_data
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_create_order_invalid_quantity(client: AsyncClient, test_product):
    """Test creating order with invalid quantity fails."""
    order_data = {
        "customer_name": "Test Customer",
        "customer_email": "customer@test.com",
        "address": "123 Test Street",
        "total_price": 100.0,
        "items": [
            {
                "product_id": test_product.id,
                "quantity": 0,  # Invalid quantity
                "price": 50.0
            }
        ]
    }

    response = await client.post(
        "/api/v1/orders/",
        json=order_data
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_orders_admin(client: AsyncClient, admin_token):
    """Test admin can get all orders."""
    response = await client.get(
        "/api/v1/orders/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_orders_unauthenticated(client: AsyncClient):
    """Test orders endpoint requires authentication."""
    response = await client.get("/api/v1/orders/")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_track_order_not_found(client: AsyncClient):
    """Test tracking non-existent order returns 404."""
    response = await client.get(
        "/api/v1/orders/track",
        params={"order_id": 99999, "email": "test@test.com"}
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_track_order_invalid_email(client: AsyncClient):
    """Test tracking with invalid email format."""
    response = await client.get(
        "/api/v1/orders/track",
        params={"order_id": 1, "email": "invalid-email"}
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_order_insufficient_stock(client: AsyncClient, test_product):
    """Creating an order exceeding stock returns 400."""
    order_data = {
        "customer_name": "Stock Test",
        "customer_email": "stock@test.com",
        "address": "123 Test Street, Test City",
        "total_price": 50000.0,
        "items": [
            {
                "product_id": test_product.id,
                "quantity": 999,  # test_product only has 100
                "price": 50.0,
            }
        ],
    }
    response = await client.post("/api/v1/orders/", json=order_data)
    assert response.status_code == 400
    assert "left" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_cancel_order(client: AsyncClient, test_order, admin_token):
    """PATCH /orders/{id}/cancel cancels order and restores stock."""
    response = await client.patch(
        f"/api/v1/orders/{test_order.id}/cancel",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "cancelled"
    assert "Stock restored" in data["message"]


@pytest.mark.asyncio
async def test_cancel_already_cancelled(client: AsyncClient, test_order, admin_token):
    """Cancelling an already-cancelled order returns 400."""
    # Cancel first
    await client.patch(
        f"/api/v1/orders/{test_order.id}/cancel",
        headers=auth_header(admin_token),
    )
    # Cancel again
    response = await client.patch(
        f"/api/v1/orders/{test_order.id}/cancel",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 400
    assert "already cancelled" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_order_status_admin(client: AsyncClient, test_order, admin_token):
    """PATCH /orders/{id}/status as admin updates status."""
    response = await client.patch(
        f"/api/v1/orders/{test_order.id}/status",
        params={"status": "confirmed"},
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    assert response.json()["new_status"] == "confirmed"


@pytest.mark.asyncio
async def test_update_order_status_forbidden(client: AsyncClient, test_order, farmer_token):
    """PATCH /orders/{id}/status as farmer returns 403."""
    response = await client.patch(
        f"/api/v1/orders/{test_order.id}/status",
        params={"status": "confirmed"},
        headers=auth_header(farmer_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_track_order_success(client: AsyncClient, test_order):
    """GET /orders/track with matching id+email returns order."""
    response = await client.get(
        "/api/v1/orders/track",
        params={"order_id": test_order.id, "email": "customer@test.com"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_order.id
    assert data["customer_email"] == "customer@test.com"
