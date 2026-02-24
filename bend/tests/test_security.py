"""
Unit tests for app.core.security — password hashing, JWT tokens, token blacklist.
"""
import pytest
from datetime import datetime, timedelta
from jose import jwt

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    blacklist_token,
    is_token_blacklisted,
    _cleanup_expired_tokens,
    _token_blacklist,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.core.config import settings


def test_password_hash_returns_bcrypt_string():
    """Hashed password should be a bcrypt hash starting with $2b$."""
    hashed = get_password_hash("TestPass123")
    assert hashed.startswith("$2b$")
    assert len(hashed) == 60


def test_verify_password_correct():
    """verify_password returns True for matching password."""
    hashed = get_password_hash("MySecret99")
    assert verify_password("MySecret99", hashed) is True


def test_verify_password_incorrect():
    """verify_password returns False for wrong password."""
    hashed = get_password_hash("MySecret99")
    assert verify_password("WrongPassword", hashed) is False


def test_create_access_token_default_expiry():
    """Token created without custom delta uses default expiry."""
    token = create_access_token(data={"sub": "user@test.com", "role": "admin"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert "exp" in payload
    # Expiry should be roughly ACCESS_TOKEN_EXPIRE_MINUTES from now
    exp_time = datetime.utcfromtimestamp(payload["exp"])
    now = datetime.utcnow()
    diff = (exp_time - now).total_seconds()
    assert diff > 0
    assert diff <= ACCESS_TOKEN_EXPIRE_MINUTES * 60 + 5  # small tolerance


def test_create_access_token_custom_expiry():
    """Token created with custom delta respects that delta."""
    token = create_access_token(
        data={"sub": "user@test.com"},
        expires_delta=timedelta(minutes=5),
    )
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    exp_time = datetime.utcfromtimestamp(payload["exp"])
    now = datetime.utcnow()
    diff = (exp_time - now).total_seconds()
    assert 0 < diff <= 5 * 60 + 5


def test_jwt_contains_sub_and_role_claims():
    """JWT payload should contain sub and role claims."""
    token = create_access_token(data={"sub": "admin@test.com", "role": "admin"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "admin@test.com"
    assert payload["role"] == "admin"


def test_blacklist_token():
    """blacklist_token adds token to the blacklist."""
    token = "fake-token-123"
    exp = datetime.utcnow() + timedelta(hours=1)
    blacklist_token(token, exp)
    assert token in _token_blacklist


def test_is_token_blacklisted_true():
    """is_token_blacklisted returns True for blacklisted token."""
    token = "blacklisted-token"
    exp = datetime.utcnow() + timedelta(hours=1)
    _token_blacklist[token] = exp
    assert is_token_blacklisted(token) is True


def test_is_token_blacklisted_false():
    """is_token_blacklisted returns False for non-blacklisted token."""
    assert is_token_blacklisted("never-seen-token") is False


def test_cleanup_expired_tokens():
    """Expired tokens are removed from blacklist during cleanup."""
    expired_token = "expired-tok"
    valid_token = "valid-tok"
    _token_blacklist[expired_token] = datetime.utcnow() - timedelta(hours=1)
    _token_blacklist[valid_token] = datetime.utcnow() + timedelta(hours=1)

    _cleanup_expired_tokens()

    assert expired_token not in _token_blacklist
    assert valid_token in _token_blacklist
