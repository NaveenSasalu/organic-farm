"""
Integration tests for user management endpoints (/api/v1/users/).
"""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_header


@pytest.mark.asyncio
async def test_list_users_admin(client: AsyncClient, admin_token):
    """GET /users/ as admin returns user list."""
    response = await client.get(
        "/api/v1/users/",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_list_users_forbidden(client: AsyncClient, farmer_token):
    """GET /users/ as farmer returns 403."""
    response = await client.get(
        "/api/v1/users/",
        headers=auth_header(farmer_token),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_user_admin(client: AsyncClient, admin_token):
    """POST /users/ as admin creates a new user."""
    response = await client.post(
        "/api/v1/users/",
        json={
            "email": "newuser@test.com",
            "password": "StrongPass1",
            "role": "farmer",
        },
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data


@pytest.mark.asyncio
async def test_create_user_duplicate_email(client: AsyncClient, admin_token, test_admin):
    """POST /users/ with existing email returns 400."""
    response = await client.post(
        "/api/v1/users/",
        json={
            "email": "admin@test.com",  # Already exists
            "password": "StrongPass1",
            "role": "admin",
        },
        headers=auth_header(admin_token),
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_user_weak_password(client: AsyncClient, admin_token):
    """POST /users/ with weak password returns 400."""
    response = await client.post(
        "/api/v1/users/",
        json={
            "email": "weak@test.com",
            "password": "short",
            "role": "farmer",
        },
        headers=auth_header(admin_token),
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_user_admin(client: AsyncClient, admin_token, test_farmer_user):
    """DELETE /users/{id} as admin deletes user."""
    response = await client.delete(
        f"/api/v1/users/{test_farmer_user.id}",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    assert response.json()["message"] == "User deleted"


@pytest.mark.asyncio
async def test_delete_self_forbidden(client: AsyncClient, admin_token, test_admin):
    """DELETE /users/{id} cannot delete yourself."""
    response = await client.delete(
        f"/api/v1/users/{test_admin.id}",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 400
    assert "Cannot delete your own account" in response.json()["detail"]


@pytest.mark.asyncio
async def test_reset_password(client: AsyncClient, admin_token, test_farmer_user):
    """POST /users/{id}/reset-password returns temporary password."""
    response = await client.post(
        f"/api/v1/users/{test_farmer_user.id}/reset-password",
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "temporary_password" in data
    assert len(data["temporary_password"]) == 10


@pytest.mark.asyncio
async def test_update_role(client: AsyncClient, admin_token, test_farmer_user):
    """PATCH /users/{id}/role updates user role."""
    response = await client.patch(
        f"/api/v1/users/{test_farmer_user.id}/role",
        params={"role": "admin"},
        headers=auth_header(admin_token),
    )
    assert response.status_code == 200
    assert response.json()["new_role"] == "admin"


@pytest.mark.asyncio
async def test_demote_self_forbidden(client: AsyncClient, admin_token, test_admin):
    """PATCH /users/{id}/role cannot demote yourself from admin."""
    response = await client.patch(
        f"/api/v1/users/{test_admin.id}/role",
        params={"role": "farmer"},
        headers=auth_header(admin_token),
    )
    assert response.status_code == 400
    assert "Cannot change your own admin role" in response.json()["detail"]
