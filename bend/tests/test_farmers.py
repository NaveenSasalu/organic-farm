"""
Integration tests for farmer endpoints (/api/v1/farmers/).
"""
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_list_farmers_public(client: AsyncClient, test_farmer):
    """GET /farmers/ is public and returns farmer list."""
    response = await client.get("/api/v1/farmers/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["name"] == "Test Farmer"


@pytest.mark.asyncio
async def test_get_farmer_detail(client: AsyncClient, test_farmer, test_product):
    """GET /farmers/{id} returns farmer with products."""
    response = await client.get(f"/api/v1/farmers/{test_farmer.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Farmer"
    assert "products" in data
    assert len(data["products"]) >= 1


@pytest.mark.asyncio
async def test_get_farmer_not_found(client: AsyncClient):
    """GET /farmers/99999 returns 404."""
    response = await client.get("/api/v1/farmers/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
@patch("app.api.v1.endpoints.farmers.upload_to_minio", new_callable=AsyncMock, return_value="https://mnio.kaayaka.in/test/pic.jpg")
async def test_register_farmer_admin(mock_upload, client: AsyncClient, admin_token):
    """POST /farmers/ as admin creates farmer + user account."""
    response = await client.post(
        "/api/v1/farmers/",
        data={
            "name": "New Farmer",
            "email": "newfarm@test.com",
            "password": "StrongPass1",
            "location": "Farm Valley",
            "bio": "Grows organic vegetables and fruits",
        },
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "farmer_id" in data


@pytest.mark.asyncio
@patch("app.api.v1.endpoints.farmers.upload_to_minio", new_callable=AsyncMock, return_value=None)
async def test_register_farmer_duplicate_email(mock_upload, client: AsyncClient, admin_token, test_farmer_user):
    """POST /farmers/ with existing email returns 400."""
    response = await client.post(
        "/api/v1/farmers/",
        data={
            "name": "Dup Farmer",
            "email": "farmer@test.com",  # Already exists via test_farmer_user
            "password": "StrongPass1",
            "location": "Some Place",
            "bio": "Some description for the bio field",
        },
        headers=auth_header(admin_token),
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_farmer_forbidden(client: AsyncClient, farmer_token):
    """POST /farmers/ as farmer role returns 403."""
    response = await client.post(
        "/api/v1/farmers/",
        data={
            "name": "Blocked Farmer",
            "email": "blocked@test.com",
            "password": "StrongPass1",
            "location": "Nowhere",
            "bio": "Should not be allowed to register",
        },
        headers=auth_header(farmer_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_farmer_admin(client: AsyncClient, admin_token, test_farmer):
    """PUT /farmers/{id} as admin updates farmer profile."""
    response = await client.put(
        f"/api/v1/farmers/{test_farmer.id}",
        data={"name": "Updated Name"},
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    assert response.json()["farmer_id"] == test_farmer.id


@pytest.mark.asyncio
async def test_update_farmer_own_profile(client: AsyncClient, farmer_token, test_farmer):
    """PUT /farmers/{id} as the farmer themselves succeeds."""
    response = await client.put(
        f"/api/v1/farmers/{test_farmer.id}",
        data={"location": "New Location Value"},
        headers=auth_header(farmer_token),
    )
    assert response.status_code == 200
