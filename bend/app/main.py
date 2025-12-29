from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import products, orders, farmers
from app.api.v1.endpoints import auth # Add this import

app = FastAPI(title="Organic Farm API")

# Define the origins that are allowed to talk to your API
origins = [
    "https://of.kaayaka.in",
    "http://of.kaayaka.in",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Trust only your domain
    allow_credentials=True,           # Required for cookies/Auth headers
    allow_methods=["*"],              # Allow GET, POST, OPTIONS, etc.
    allow_headers=["*"],              # Allow all headers
)

app.include_router(products.router, prefix="/api/v1/products", tags=["products"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(farmers.router, prefix="/api/v1/farmers", tags=["farmers"])

# Add the auth router
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Farm API"}