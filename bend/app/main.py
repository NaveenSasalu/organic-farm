import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.endpoints import products, orders, farmers, users, auth
from app.core.config import settings

# Check environment
is_production = settings.is_production

# Setup basic logging
logging.basicConfig(
    level=logging.DEBUG if not is_production else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Try to import optional dependencies
try:
    from slowapi.errors import RateLimitExceeded
    from app.middleware.rate_limit import limiter, rate_limit_handler
    RATE_LIMITING_ENABLED = True
    logger.info("Rate limiting enabled")
except ImportError:
    RATE_LIMITING_ENABLED = False
    logger.warning("slowapi not installed - rate limiting disabled")

try:
    from app.middleware.request_id import RequestIDMiddleware
    REQUEST_ID_ENABLED = True
except ImportError:
    REQUEST_ID_ENABLED = False
    logger.warning("Request ID middleware not available")

# Create FastAPI app with enhanced OpenAPI documentation
app = FastAPI(
    title="Organic Farm API",
    description="""
## Organic Farm E-commerce API

This API powers the Organic Oasis farm-to-table e-commerce platform.

### Features
- **Products**: Browse and manage organic produce inventory
- **Orders**: Place and track customer orders
- **Farmers**: Farmer profiles and product sourcing
- **Authentication**: Secure JWT-based authentication

### Authentication
Most endpoints require authentication via JWT token.
Include the token in the `Authorization` header:
```
Authorization: Bearer <your_token>
```
    """,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    contact={
        "name": "Organic Farm Support",
        "email": "support@kaayaka.in",
    },
    license_info={
        "name": "Private",
    },
)

# Add rate limiter if available
if RATE_LIMITING_ENABLED:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# Add request ID middleware if available
if REQUEST_ID_ENABLED:
    app.add_middleware(RequestIDMiddleware)

# Define allowed origins
origins = [
    "https://of.kaayaka.in",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if not is_production:
    origins.append("*")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],  # Expose request ID header
)

# Include routers
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(farmers.router, prefix="/api/v1/farmers", tags=["Farmers"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {"message": "Welcome to the Farm API", "status": "healthy"}


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
    }


@app.on_event("startup")
async def startup_event():
    """Log application startup."""
    logger.info(
        f"Application starting up",
        extra={"environment": settings.ENVIRONMENT}
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Log application shutdown."""
    logger.info("Application shutting down")