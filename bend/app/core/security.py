from datetime import datetime, timedelta
from typing import Any, Union, Optional, Set, Dict
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.core.config import settings
import bcrypt

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration - Use settings from environment, NOT hardcoded values
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour (reduced from 24h for security)

# Token Blacklist - In-memory storage (use Redis in production for scalability)
# Stores token -> expiration_time for cleanup
_token_blacklist: Dict[str, datetime] = {}


def blacklist_token(token: str, exp_time: datetime) -> None:
    """Add a token to the blacklist until it expires."""
    _token_blacklist[token] = exp_time
    # Cleanup expired tokens to prevent memory bloat
    _cleanup_expired_tokens()


def is_token_blacklisted(token: str) -> bool:
    """Check if a token is blacklisted."""
    _cleanup_expired_tokens()
    return token in _token_blacklist


def _cleanup_expired_tokens() -> None:
    """Remove expired tokens from blacklist."""
    now = datetime.utcnow()
    expired = [t for t, exp in _token_blacklist.items() if exp < now]
    for t in expired:
        del _token_blacklist[t]


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hash_bytes.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # Use SECRET_KEY from settings (environment variable), not hardcoded
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Union[User, bool]:
    """Authenticate a user by email and password."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user
