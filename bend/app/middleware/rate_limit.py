"""
Rate limiting middleware using slowapi.
Falls back to no-op if slowapi is not installed.
"""
import logging
from functools import wraps
from typing import Callable, Optional

logger = logging.getLogger(__name__)

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware
    from starlette.requests import Request

    SLOWAPI_AVAILABLE = True

    def get_client_ip(request: Request) -> str:
        """Get client IP address, considering X-Forwarded-For header."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        if request.client:
            return request.client.host
        return "unknown"

    # Create the limiter instance
    limiter = Limiter(
        key_func=get_client_ip,
        default_limits=["100/minute"],
        storage_uri="memory://",
    )

    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        """Custom handler for rate limit exceeded errors."""
        client_ip = get_client_ip(request)
        logger.warning(f"Rate limit exceeded for {client_ip} on {request.url.path}")
        return _rate_limit_exceeded_handler(request, exc)

    class RateLimitMiddleware(SlowAPIMiddleware):
        """Rate limiting middleware wrapper."""
        pass

except ImportError:
    SLOWAPI_AVAILABLE = False
    logger.warning("slowapi not installed - rate limiting disabled")

    # Create no-op limiter
    class NoOpLimiter:
        """No-op limiter when slowapi is not available."""
        def limit(self, limit_string: str):
            """Return a no-op decorator."""
            def decorator(func: Callable) -> Callable:
                return func
            return decorator

    limiter = NoOpLimiter()
    rate_limit_handler = None
    RateLimitMiddleware = None
