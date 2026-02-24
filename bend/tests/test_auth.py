"""
Tests for authentication endpoints.
"""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_admin):
    """Test successful login returns token."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin@test.com", "password": "TestPass123"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "admin"
    assert data["email"] == "admin@test.com"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, test_admin):
    """Test login with wrong password fails."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "admin@test.com", "password": "WrongPassword123"}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_invalid_email(client: AsyncClient):
    """Test login with non-existent email fails."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "nonexistent@test.com", "password": "TestPass123"}
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, test_admin, admin_token):
    """Test getting current user info."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


@pytest.mark.asyncio
async def test_get_current_user_no_token(client: AsyncClient):
    """Test getting current user without token fails."""
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, admin_token):
    """Test logout endpoint."""
    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    assert response.status_code == 200
    assert response.json()["detail"] == "Successfully logged out"


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """POST /auth/register creates farmer user and returns token."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "New Farmer",
            "email": "register@test.com",
            "password": "StrongPass1",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "farmer"
    assert data["email"] == "register@test.com"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_admin):
    """POST /auth/register with existing email returns 400."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Duplicate",
            "email": "admin@test.com",
            "password": "StrongPass1",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    """POST /auth/register with weak password returns 400."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "name": "Weak User",
            "email": "weak@test.com",
            "password": "short",
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_blacklisted_token_rejected(client: AsyncClient, admin_token):
    """After logout, using the same token returns 401."""
    # Logout to blacklist the token
    await client.post(
        "/api/v1/auth/logout",
        headers=auth_header(admin_token),
    )

    # Try to use the blacklisted token
    response = await client.get(
        "/api/v1/auth/me",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 401
