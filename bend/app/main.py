from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import products, orders, farmers
from app.api.v1.endpoints import auth # Add this import

app = FastAPI(title="Organic Farm API")

# Ensure CORS is configured correctly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://of.kaayaka.in"], # Your production domain
    allow_credentials=True,
    allow_methods=["*"], # This must allow OPTIONS and POST
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(farmers.router, prefix="/api/v1/farmers", tags=["farmers"])

# Add the auth router
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Farm API"}