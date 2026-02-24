"""
Tests for product endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_public_products(client: AsyncClient, test_product):
    """Test public products endpoint returns products."""
    response = await client.get("/api/v1/products/public")

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_get_public_products_pagination(client: AsyncClient, test_product):
    """Test public products endpoint with pagination."""
    response = await client.get(
        "/api/v1/products/public",
        params={"page": 1, "page_size": 5}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 5


@pytest.mark.asyncio
async def test_get_products_authenticated(client: AsyncClient, test_product, admin_token):
    """Test authenticated products endpoint."""
    response = await client.get(
        "/api/v1/products/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_get_products_unauthenticated(client: AsyncClient):
    """Test products endpoint requires authentication."""
    response = await client.get("/api/v1/products/")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_stock_admin(client: AsyncClient, test_product, admin_token):
    """Test admin can update product stock."""
    response = await client.patch(
        f"/api/v1/products/{test_product.id}/stock",
        params={"qty": 50},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["new_qty"] == 50


@pytest.mark.asyncio
async def test_update_stock_negative_fails(client: AsyncClient, test_product, admin_token):
    """Test updating stock to negative value fails."""
    response = await client.patch(
        f"/api/v1/products/{test_product.id}/stock",
        params={"qty": -10},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 400
    assert "negative" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_stock_not_found(client: AsyncClient, admin_token):
    """Test updating non-existent product fails."""
    response = await client.patch(
        "/api/v1/products/99999/stock",
        params={"qty": 50},
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 404
