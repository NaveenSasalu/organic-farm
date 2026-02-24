# Organic Farm (of.kaayaka.in) - Comprehensive Test Plan

**Version:** 1.0
**Last Updated:** 2026-02-24
**Application:** Organic Oasis - Farm-to-table e-commerce platform
**Stack:** FastAPI (Python) + Next.js 16 (TypeScript) + PostgreSQL + MinIO S3

---

## Table of Contents

1. [Health & Infrastructure](#1-health--infrastructure)
2. [Authentication](#2-authentication)
3. [Products](#3-products)
4. [Orders](#4-orders)
5. [Farmers](#5-farmers)
6. [Users & Admin](#6-users--admin)
7. [Cart & Checkout (Frontend)](#7-cart--checkout-frontend)
8. [Order Tracking (Frontend)](#8-order-tracking-frontend)
9. [Security & Edge Cases](#9-security--edge-cases)

---

## Test Environment

| Component | Detail |
|-----------|--------|
| Backend URL | `https://of.kaayaka.in/api/v1` (prod) / `http://localhost:8000/api/v1` (dev) |
| Frontend URL | `https://of.kaayaka.in` (prod) / `http://localhost:3000` (dev) |
| API Docs | `/api/docs` (Swagger) / `/api/redoc` (ReDoc) |
| DB | PostgreSQL (namespace: `infra`) |
| Object Storage | MinIO at `mnio.kaayaka.in` (port 9000) |
| Auth | JWT (HS256), 1-hour expiry, in-memory token blacklist |

### Roles

| Role | Access |
|------|--------|
| **Public** (no auth) | Browse products, create orders, track orders, view farmers |
| **Farmer** | Own products, own order items, harvest marking, profile edit |
| **Admin** | Everything: all orders, all products, user CRUD, farmer CRUD |

---

## 1. Health & Infrastructure

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| H-01 | Root endpoint returns healthy | Server running | `GET /` | `200` with `{"message": "Welcome to the Farm API", "status": "healthy"}` | Positive |
| H-02 | Health check returns environment info | Server running | `GET /health` | `200` with `{"status": "healthy", "environment": "<env>", "version": "1.0.0"}` | Positive |
| H-03 | OpenAPI docs accessible | Server running | `GET /api/docs` | `200`, Swagger UI renders | Positive |
| H-04 | ReDoc accessible | Server running | `GET /api/redoc` | `200`, ReDoc UI renders | Positive |
| H-05 | CORS headers present for allowed origin | Server running | `OPTIONS /api/v1/products/public` with `Origin: https://of.kaayaka.in` | Response includes `Access-Control-Allow-Origin: https://of.kaayaka.in` and `X-Request-ID` in `Access-Control-Expose-Headers` | Positive |
| H-06 | Request ID middleware attaches header | Server running | `GET /health` | Response includes `X-Request-ID` header with UUID value | Positive |

---

## 2. Authentication

**Endpoints:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`

### 2.1 Registration

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| A-01 | Successful registration | No user with email `test@example.com` | `POST /auth/register` with `{"name": "Test User", "email": "test@example.com", "password": "StrongPass1"}` | `200` with `access_token`, `token_type: "bearer"`, `role: "farmer"`, `email` | Positive |
| A-02 | Registration - duplicate email | User with `test@example.com` exists | Same request as A-01 | `400` with `"Email already registered"` | Negative |
| A-03 | Registration - password too short | None | `POST /auth/register` with `password: "Short1"` | `400` with `"Password must be at least 8 characters long"` | Negative |
| A-04 | Registration - password no uppercase | None | `POST /auth/register` with `password: "nouppercas1"` | `400` with `"Password must contain at least one uppercase letter"` | Negative |
| A-05 | Registration - password no lowercase | None | `POST /auth/register` with `password: "NOLOWERCASE1"` | `400` with `"Password must contain at least one lowercase letter"` | Negative |
| A-06 | Registration - password no digit | None | `POST /auth/register` with `password: "NoDigitHere"` | `400` with `"Password must contain at least one digit"` | Negative |
| A-07 | Registration - name too short | None | `POST /auth/register` with `name: "A"` | `400` with `"Name must be at least 2 characters"` | Negative |
| A-08 | Registration - invalid email format | None | `POST /auth/register` with `email: "not-an-email"` | `422` validation error (Pydantic EmailStr) | Negative |

### 2.2 Login

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| A-09 | Successful login | Registered user exists | `POST /auth/login` with `{"username": "user@example.com", "password": "StrongPass1"}` | `200` with `access_token`, `token_type`, `role`, `email` | Positive |
| A-10 | Login - wrong password | Registered user exists | `POST /auth/login` with wrong password | `401` with `"Invalid email or password"` | Negative |
| A-11 | Login - non-existent email | No such user | `POST /auth/login` with `username: "ghost@example.com"` | `401` with `"Invalid email or password"` | Negative |
| A-12 | Login - rate limited | None | Send 6 login requests within 1 minute | 6th request returns `429` rate limit exceeded | Security |

### 2.3 Logout & Token

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| A-13 | Successful logout | Valid token | `POST /auth/logout` with `Authorization: Bearer <token>` | `200` with `"Successfully logged out"` | Positive |
| A-14 | Blacklisted token rejected | Token blacklisted via logout | `GET /auth/me` with the blacklisted token | `401` with `"Token has been revoked"` | Security |
| A-15 | Get current user info | Valid token | `GET /auth/me` | `200` with `{id, email, role, farmer_id}` | Positive |
| A-16 | Invalid/expired token | Expired or malformed JWT | `GET /auth/me` with bad token | `403` with `"Could not validate credentials"` | Negative |
| A-17 | Missing Authorization header | No token | `GET /auth/me` (no header) | `401` (OAuth2 scheme rejects) | Negative |

---

## 3. Products

**Endpoints:** `GET /api/v1/products/`, `GET /api/v1/products/public`, `PATCH /api/v1/products/{id}/stock`, `POST /api/v1/products/upsert`

### 3.1 Public Product Listing

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| P-01 | List public products (default pagination) | Products exist in DB | `GET /products/public` | `200` with `{items: [...], total, page: 1, page_size: 20, total_pages}` | Positive |
| P-02 | Public products - custom pagination | Products exist | `GET /products/public?page=2&page_size=5` | `200`, returns page 2 with up to 5 items | Positive |
| P-03 | Public products - invalid page_size | None | `GET /products/public?page_size=0` | `422` validation error (`ge=1`) | Negative |
| P-04 | Public products - page_size exceeds max | None | `GET /products/public?page_size=101` | `422` validation error (`le=100`) | Negative |
| P-05 | Public products - includes farmer info | Product with farmer | `GET /products/public` | Each product item includes `farmer` object with `{id, name, bio, location, profile_pic}` | Positive |
| P-06 | Public products - rate limited | None | Send 31 requests in 1 minute | 31st returns `429` | Security |

### 3.2 Authenticated Product Listing

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| P-07 | Admin sees all products | Admin token | `GET /products/` with admin token | `200`, returns all products | Positive |
| P-08 | Farmer sees only own products | Farmer token (farmer_id=1) | `GET /products/` with farmer token | `200`, all returned products have `farmer_id` matching current farmer | Positive |
| P-09 | Farmer without farmer_id linked | Farmer user with `farmer_id=null` | `GET /products/` with this token | `403` with `"Farmer profile not linked"` | Negative |

### 3.3 Product Upsert (Create/Update)

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| P-10 | Create new product (admin) | Admin token, farmer exists | `POST /products/upsert` (multipart form) with `name, price, stock_qty, unit, farmer_id` | `200` with `"Success"` | Positive |
| P-11 | Update existing product | Admin token, product id=1 exists | `POST /products/upsert` with `id=1` and updated fields | `200`, product updated | Positive |
| P-12 | Upsert with image upload | Admin token | `POST /products/upsert` with `file` (JPEG image) | `200`, `image_url` populated with MinIO URL | Positive |
| P-13 | Farmer creates product for own farm | Farmer token (farmer_id=1) | `POST /products/upsert` with `farmer_id=1` | `200` | Positive |
| P-14 | Farmer creates product for another farm | Farmer token (farmer_id=1) | `POST /products/upsert` with `farmer_id=2` | `403` with `"Farmers can only manage their own products"` | Security |
| P-15 | Negative price rejected | Admin token | `POST /products/upsert` with `price=-10` | `400` with `"Price cannot be negative"` | Negative |
| P-16 | Negative stock rejected | Admin token | `POST /products/upsert` with `stock_qty=-5` | `400` with `"Stock quantity cannot be negative"` | Negative |

### 3.4 Stock Update

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| P-17 | Update stock (admin) | Product id=1 exists | `PATCH /products/1/stock?qty=50` with admin token | `200` with `{status: "success", new_qty: 50}` | Positive |
| P-18 | Farmer updates own product stock | Farmer owns product id=1 | `PATCH /products/1/stock?qty=30` with farmer token | `200` | Positive |
| P-19 | Farmer updates another farmer's product | Farmer does not own product id=2 | `PATCH /products/2/stock?qty=30` with farmer token | `403` with `"Not authorized to update this product"` | Security |
| P-20 | Update stock - product not found | Product id=999 doesn't exist | `PATCH /products/999/stock?qty=10` | `404` with `"Product not found"` | Negative |
| P-21 | Negative stock rejected | Product exists | `PATCH /products/1/stock?qty=-1` | `400` with `"Stock quantity cannot be negative"` | Negative |

---

## 4. Orders

**Endpoints:** `POST /api/v1/orders/`, `GET /api/v1/orders/`, `PATCH /api/v1/orders/{id}/cancel`, `PATCH /api/v1/orders/{id}/status`, `PATCH /api/v1/orders/items/{id}/harvest`, `GET /api/v1/orders/farmer-items`, `GET /api/v1/orders/track`

### 4.1 Order Creation (Public)

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| O-01 | Create order successfully | Products with sufficient stock | `POST /orders/` with valid `OrderCreate` body | `200` with `{status: "success", order_id: <int>}` | Positive |
| O-02 | Stock reduced after order | Product stock=10 | Create order with quantity=3 | Product stock becomes 7 | Positive |
| O-03 | Order with insufficient stock | Product stock=2 | Order with quantity=5 | `400` with `"Only 2 <unit> of <name> left!"` | Negative |
| O-04 | Order with non-existent product | No product id=999 | Order with `product_id=999` | `404` with `"Product 999 not found"` | Negative |
| O-05 | Order with empty items | None | `POST /orders/` with `items: []` | `422` validation error (`min_length=1`) | Negative |
| O-06 | Order - customer name too short | None | Order with `customer_name: "A"` | `422` validation error (`min_length=2`) | Negative |
| O-07 | Order - address too short | None | Order with `address: "Short"` | `422` validation error (`min_length=10`) | Negative |
| O-08 | Order - invalid email | None | Order with `customer_email: "bad"` | `422` validation error (EmailStr) | Negative |
| O-09 | Order - quantity exceeds max | None | Order with `quantity: 1001` | `422` validation error (`le=1000`) | Negative |
| O-10 | Order - negative total price | None | Order with `total_price: -10` | `422` validation error (`ge=0`) | Negative |

### 4.2 Order Listing (Authenticated)

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| O-11 | Admin lists all orders | Admin token, orders exist | `GET /orders/` | `200` with paginated orders including items with product and farmer data | Positive |
| O-12 | Admin filters by status | Admin token | `GET /orders/?status=pending` | `200`, all returned orders have `status: "pending"` | Positive |
| O-13 | Farmer sees only own product orders | Farmer token (farmer_id=1) | `GET /orders/` | `200`, each order's items only include products where `farmer_id=1` | Positive |
| O-14 | Pagination works | Admin token, many orders | `GET /orders/?page=1&page_size=5` | `200`, `total_pages` calculated correctly, max 5 items returned | Positive |

### 4.3 Order Status Updates

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| O-15 | Admin updates order status | Admin token, order id=1 pending | `PATCH /orders/1/status?status=confirmed` | `200` with `{status: "updated", new_status: "confirmed"}` | Positive |
| O-16 | Farmer cannot update order status | Farmer token | `PATCH /orders/1/status?status=confirmed` | `403` with `"Admin access required"` | Security |
| O-17 | Update status - order not found | Admin token | `PATCH /orders/999/status?status=confirmed` | `404` with `"Order not found"` | Negative |
| O-18 | Invalid status value | Admin token | `PATCH /orders/1/status?status=invalid` | `422` validation error (OrderStatus enum) | Negative |

### 4.4 Order Cancellation

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| O-19 | Cancel pending order | Order id=1, status=pending | `PATCH /orders/1/cancel` with auth token | `200` with `{status: "cancelled", message: "Stock restored"}` | Positive |
| O-20 | Stock restored on cancel | Product stock=7 after order of qty=3 | Cancel the order | Product stock returns to 10 | Positive |
| O-21 | Cancel already cancelled order | Order status=cancelled | `PATCH /orders/1/cancel` | `400` with `"Order already cancelled"` | Negative |
| O-22 | Cancel delivered order | Order status=delivered | `PATCH /orders/1/cancel` | `400` with `"Cannot cancel delivered order"` | Negative |
| O-23 | Cancel non-existent order | No order id=999 | `PATCH /orders/999/cancel` | `404` with `"Order not found"` | Negative |

### 4.5 Harvest Marking

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| O-24 | Farmer marks item as harvested | Farmer token, item belongs to farmer's product | `PATCH /orders/items/1/harvest` | `200` with `{status: "harvested", item_id: 1, order_status, all_items_harvested}` | Positive |
| O-25 | All items harvested auto-packs order | Order pending, last unharvested item | Mark last item harvested | `order_status: "packed"`, `all_items_harvested: true` | Positive |
| O-26 | Farmer cannot harvest another farmer's item | Farmer token, item belongs to different farmer | `PATCH /orders/items/2/harvest` | `403` with `"Not authorized to update this item"` | Security |
| O-27 | Harvest non-existent item | No item id=999 | `PATCH /orders/items/999/harvest` | `404` with `"Order item not found"` | Negative |

### 4.6 Farmer Items

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| O-28 | Farmer gets own order items | Farmer token with farmer_id | `GET /orders/farmer-items` | `200`, list of order items for farmer's products | Positive |
| O-29 | Non-farmer access denied | Admin token | `GET /orders/farmer-items` | `403` with `"Only farmers can access this endpoint"` | Security |
| O-30 | Farmer without profile linked | Farmer user, farmer_id=null | `GET /orders/farmer-items` | `403` with `"Farmer profile not linked"` | Negative |

### 4.7 Order Tracking (Public)

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| O-31 | Track order successfully | Order id=1 with email=test@example.com | `GET /orders/track?order_id=1&email=test@example.com` | `200` with full order details including items and harvest status | Positive |
| O-32 | Track - wrong email | Order id=1, different email | `GET /orders/track?order_id=1&email=wrong@example.com` | `404` with `"Order not found"` (generic message prevents enumeration) | Security |
| O-33 | Track - non-existent order | No order id=999 | `GET /orders/track?order_id=999&email=any@example.com` | `404` | Negative |
| O-34 | Track - invalid order_id | None | `GET /orders/track?order_id=0&email=test@example.com` | `422` validation error (`gt=0`) | Negative |
| O-35 | Track - rate limited | None | Send 11 requests in 1 minute | 11th returns `429` | Security |

---

## 5. Farmers

**Endpoints:** `GET /api/v1/farmers/`, `POST /api/v1/farmers/`, `PUT /api/v1/farmers/{id}`, `GET /api/v1/farmers/{id}`

### 5.1 Public Farmer Endpoints

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| F-01 | List all farmers | Farmers exist | `GET /farmers/` | `200` with array of farmer objects `[{id, name, bio, location, profile_pic}]` | Positive |
| F-02 | Get farmer detail with products | Farmer id=1 with products | `GET /farmers/1` | `200` with farmer object including `products` array | Positive |
| F-03 | Get non-existent farmer | No farmer id=999 | `GET /farmers/999` | `404` with `"Farmer not found"` | Negative |

### 5.2 Farmer Registration (Admin Only)

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| F-04 | Admin registers farmer | Admin token, unique email | `POST /farmers/` (multipart) with `name, email, password, location, bio` | `200` with `{message: "Farmer and User account created successfully", farmer_id}` | Positive |
| F-05 | Farmer registration creates user account | After F-04 | Query users table | New user exists with `role: "farmer"` and `farmer_id` linked | Positive |
| F-06 | Register with profile picture | Admin token | `POST /farmers/` with `file` (image) | `200`, farmer has `profile_pic` URL | Positive |
| F-07 | Register - duplicate email | Email already exists | `POST /farmers/` | `400` with `"Email already registered"` | Negative |
| F-08 | Register - weak password | Admin token | `POST /farmers/` with `password: "weak"` | `400` with password requirement error | Negative |
| F-09 | Register - name too short | Admin token | `POST /farmers/` with `name: "A"` | `422` validation error (`min_length=2`) | Negative |
| F-10 | Register - invalid email format | Admin token | `POST /farmers/` with `email: "bad"` | `400` with `"Invalid email format"` | Negative |
| F-11 | Non-admin cannot register farmer | Farmer token | `POST /farmers/` | `403` with `"Admin access required"` | Security |

### 5.3 Farmer Profile Update

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| F-12 | Admin updates farmer | Admin token, farmer id=1 | `PUT /farmers/1` with updated `name, location, bio` | `200` with `{message: "Farmer updated", farmer_id: 1}` | Positive |
| F-13 | Farmer updates own profile | Farmer token (farmer_id=1) | `PUT /farmers/1` with updated fields | `200` | Positive |
| F-14 | Farmer updates another farmer | Farmer token (farmer_id=1) | `PUT /farmers/2` | `403` with `"Not authorized to edit this farmer"` | Security |
| F-15 | Update non-existent farmer | Admin token | `PUT /farmers/999` | `404` with `"Farmer not found"` | Negative |
| F-16 | Update farmer profile picture | Admin or own farmer token | `PUT /farmers/1` with new `file` | `200`, profile_pic URL updated | Positive |

---

## 6. Users & Admin

**Endpoints:** `GET /api/v1/users/`, `POST /api/v1/users/`, `DELETE /api/v1/users/{id}`, `POST /api/v1/users/{id}/reset-password`, `PATCH /api/v1/users/{id}/role`

### 6.1 User Listing

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| U-01 | Admin lists all users | Admin token | `GET /users/` | `200` with array of user objects `[{id, email, role, farmer_id, hashed_password}]` | Positive |
| U-02 | Non-admin cannot list users | Farmer token | `GET /users/` | `403` with `"Admin access required"` | Security |

### 6.2 User Creation

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| U-03 | Admin creates user | Admin token, unique email | `POST /users/` with `{email, password, role: "farmer"}` | `200` with `{message: "User created", user_id}` | Positive |
| U-04 | Create user - invalid role | Admin token | `POST /users/` with `role: "superadmin"` | `400` with `"Role must be 'admin' or 'farmer'"` | Negative |
| U-05 | Create user - weak password | Admin token | `POST /users/` with `password: "short"` | `400` with `"Password must be at least 8 characters"` | Negative |
| U-06 | Create user - duplicate email | Admin token, email exists | `POST /users/` | `400` with `"Email already registered"` | Negative |

### 6.3 User Deletion

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| U-07 | Admin deletes user | Admin token, target user exists | `DELETE /users/5` | `200` with `"User deleted"` | Positive |
| U-08 | Admin cannot delete self | Admin token (user_id=1) | `DELETE /users/1` | `400` with `"Cannot delete your own account"` | Negative |
| U-09 | Delete non-existent user | Admin token | `DELETE /users/999` | `404` with `"User not found"` | Negative |
| U-10 | Invalid user_id (0 or negative) | Admin token | `DELETE /users/0` | `422` validation error (`gt=0`) | Negative |

### 6.4 Password Reset

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| U-11 | Admin resets user password | Admin token, target user exists | `POST /users/5/reset-password` | `200` with `{temporary_password: "<10-char string>"}` | Positive |
| U-12 | Temp password meets requirements | After U-11 | Parse `temporary_password` | Contains uppercase, lowercase, digits; length=10 | Positive |
| U-13 | User can login with temp password | After U-11 | `POST /auth/login` with temp password | `200` with access_token | Positive |
| U-14 | Admin cannot reset own password | Admin token (user_id=1) | `POST /users/1/reset-password` | `400` with `"Cannot reset your own password through this endpoint"` | Negative |
| U-15 | Reset password - user not found | Admin token | `POST /users/999/reset-password` | `404` with `"User not found"` | Negative |

### 6.5 Role Update

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| U-16 | Admin updates user role | Admin token, target user exists | `PATCH /users/5/role?role=admin` | `200` with `{message: "Role updated", new_role: "admin"}` | Positive |
| U-17 | Admin cannot demote self | Admin token (user_id=1) | `PATCH /users/1/role?role=farmer` | `400` with `"Cannot change your own admin role"` | Negative |
| U-18 | Update role - user not found | Admin token | `PATCH /users/999/role?role=farmer` | `404` with `"User not found"` | Negative |

---

## 7. Cart & Checkout (Frontend)

**Files:** `store.ts` (Zustand), `AddToCartButton.tsx`, `CartCounter.tsx`, `CartDrawer.tsx`, `checkout/page.tsx`, `validation.ts`

### 7.1 Cart Store (Zustand)

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| C-01 | Add product to empty cart | Cart empty | Click "Add to Cart" on product | Item added with quantity=1, cart persisted in localStorage (`farm-cart-storage`) | Positive |
| C-02 | Add same product again | Product already in cart (qty=1) | Click "Add to Cart" again | Quantity increments to 2 (no duplicate entry) | Positive |
| C-03 | Remove item from cart | Item in cart | Click remove button in CartDrawer | Item removed, cart count updated | Positive |
| C-04 | Update quantity to 0 removes item | Item in cart with qty=1 | Decrease quantity to 0 | Item removed from cart | Edge |
| C-05 | Clear cart | Multiple items in cart | Call `clearCart()` (via checkout success) | Cart empty, `items: []` | Positive |
| C-06 | Cart persists across page reload | Items in cart | Reload browser | Cart items restored from localStorage | Positive |
| C-07 | Total price calculated correctly | Items: [{price:50, qty:2}, {price:30, qty:1}] | Check `totalPrice()` | Returns 130 (50*2 + 30*1) | Positive |
| C-08 | Item count sums quantities | Items with qty 2 and qty 3 | Check `itemCount()` | Returns 5 | Positive |
| C-09 | Cart drawer toggle | Drawer closed | Click cart icon (CartCounter) | Drawer opens; click again to close | Positive |
| C-10 | Out-of-stock product cannot be added | Product with `stock_qty: 0` | View product card | "Add to Cart" button replaced with disabled "Sold Out" button | Positive |

### 7.2 Checkout Flow

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| C-11 | Successful checkout | Items in cart | Fill name, email, address; submit | Order created, success screen shows order number and email | Positive |
| C-12 | Cart validation on mount | Items in cart, navigate to `/checkout` | Page loads | Products validated against server (price/stock check), quantities adjusted if needed | Positive |
| C-13 | Empty cart shows message | No items in cart | Navigate to `/checkout` | "Your basket is empty" with link to shop | Positive |
| C-14 | Checkout form - name validation | Items in cart | Submit with name "A" (1 char) | Error: "Name must be at least 2 characters" | Negative |
| C-15 | Checkout form - email validation | Items in cart | Submit with `email: "bad"` | Error: "Please enter a valid email address" | Negative |
| C-16 | Checkout form - address validation | Items in cart | Submit with `address: "Short"` (< 10 chars) | Error: "Please enter a complete address (at least 10 characters)" | Negative |
| C-17 | Server-side stock error during checkout | Product stock reduced since cart was loaded | Submit order | Error message from server (e.g., "Only 2 kg of Tomatoes left!") | Negative |
| C-18 | Success screen shows Track Order link | After successful order | View success screen | "Track My Order" link includes order_id and email as query params | Positive |
| C-19 | Cart cleared after successful order | After successful order | Check localStorage | Cart items cleared | Positive |

---

## 8. Order Tracking (Frontend)

**File:** `track/page.tsx`

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| T-01 | Track order via form | Order exists | Enter order ID + email, click "Track Order" | Order details displayed: status badge, items list, harvest status, total price | Positive |
| T-02 | Auto-track from URL params | URL: `/track?order=1&email=test@example.com` | Navigate to URL | Order fetched and displayed automatically | Positive |
| T-03 | Track - order not found | Wrong ID/email | Enter mismatched data | Error: "Order not found. Please check your order number and email." | Negative |
| T-04 | Track - empty fields | Both fields empty | Click "Track Order" | Error: "Please enter both order number and email" | Negative |
| T-05 | Track - invalid order ID | Non-numeric or 0 | Enter "abc" or "0" | Error: "Please enter a valid order number" (client-side validation) | Negative |
| T-06 | Track - invalid email | Bad email format | Enter "not-an-email" | Error: "Please enter a valid email address" | Negative |
| T-07 | Status icons correct | Order tracked | View status badge | pending=Clock/amber, confirmed=Truck/blue, packed=Package/purple, delivered=CheckCircle/green, cancelled=XCircle/red | Positive |
| T-08 | Harvested items marked | Order with harvested items | Track order | Items with `is_harvested: true` show green "Harvested" badge with leaf icon | Positive |
| T-09 | Rate limit error handled | Too many requests | Track 11+ times in 1 minute | Error: "Too many requests. Please wait a moment and try again." | Edge |

---

## 9. Security & Edge Cases

### 9.1 Authentication & Authorization

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| S-01 | JWT token contains role claim | User logged in | Decode JWT payload | Contains `sub` (email) and `role` fields | Security |
| S-02 | Token expires after 1 hour | Token issued | Wait 60+ minutes, then use token | `403` with credential error | Security |
| S-03 | Farmer cannot access admin endpoints | Farmer token | `GET /users/`, `DELETE /users/1`, `POST /users/` | `403` in all cases | Security |
| S-04 | Public endpoints work without token | No auth | `GET /products/public`, `GET /farmers/`, `GET /farmers/1`, `POST /orders/`, `GET /orders/track` | All return `200` (or appropriate data-dependent status) | Security |
| S-05 | Token blacklist cleanup | Blacklisted expired token | After token expiry time | Token removed from in-memory blacklist (no memory leak) | Edge |

### 9.2 File Upload Security

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| S-06 | Valid image upload accepted | Auth token | Upload JPEG file via product upsert | `200`, file stored in MinIO with UUID filename | Positive |
| S-07 | Oversized image rejected | Auth token | Upload >10MB image | `413` with `"File too large. Maximum size is 10.0 MB"` | Security |
| S-08 | Non-image MIME type rejected | Auth token, file_validation enabled | Upload `.exe` file renamed to `.jpg` | `415` with MIME type not allowed error | Security |
| S-09 | Uploaded files get UUID names | Auth token | Upload `my-photo.jpg` | Stored as `<uuid>.jpg` in MinIO (no path traversal) | Security |

### 9.3 Frontend Security

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| S-10 | Image URL sanitization | Product with external image URL | Render product card | `sanitizeImageUrl()` only allows domains: `of.kaayaka.in`, `mnio.kaayaka.in`, `placehold.co`, `localhost`, `127.0.0.1`, `minio`, `organic-farm-minio` | Security |
| S-11 | Non-http protocol image rejected | Image URL with `javascript:` protocol | Call `isValidImageUrl("javascript:alert(1)")` | Returns `false` | Security |
| S-12 | Order ID validation prevents enumeration | None | Call `isValidOrderId("0")` / `isValidOrderId("-1")` / `isValidOrderId("99999999")` | Returns `false` for all invalid values | Security |

### 9.4 Middleware & Route Protection

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| S-13 | Unauthenticated user redirected from admin | No cookie | Navigate to `/admin/orders` | Redirected to `/login` | Security |
| S-14 | Authenticated user redirected from login | Valid `access_token` cookie | Navigate to `/login` | Redirected to `/admin/orders` | Positive |
| S-15 | Public pages accessible without auth | No cookie | Navigate to `/`, `/track`, `/checkout`, `/farmer/1` | All load without redirect | Positive |
| S-16 | API client clears token on 401 | Expired token in localStorage | Make any authenticated API call | Token removed from localStorage, subsequent calls are unauthenticated | Security |

### 9.5 Data Integrity

| ID | Scenario | Preconditions | Steps | Expected Result | Category |
|----|----------|---------------|-------|-----------------|----------|
| S-17 | Order creation is transactional | Product stock=2, order qty=5 | Attempt order | `400` error, stock unchanged (rollback) | Edge |
| S-18 | Concurrent order stock race condition | Product stock=1, two simultaneous orders | Submit both at once | Only one succeeds; the other gets insufficient stock error | Edge |
| S-19 | DB constraints enforce positive prices | Direct DB manipulation | Try to insert product with price=-1 | DB check constraint `chk_products_price_positive` rejects | Edge |
| S-20 | DB constraints enforce positive quantity | Direct DB manipulation | Try to insert order item with quantity=0 | DB check constraint `chk_order_items_quantity_positive` rejects | Edge |
| S-21 | Cascade delete: farmer deletion removes products | Farmer with products | Delete farmer from DB | All products with that `farmer_id` also deleted | Edge |
| S-22 | Order item delete restricted if product exists | Order item referencing product | Try to delete product | `RESTRICT` foreign key prevents deletion while order items reference it | Edge |

---

## Summary

| Section | Test Cases | Positive | Negative | Security | Edge |
|---------|-----------|----------|----------|----------|------|
| 1. Health & Infrastructure | 6 | 5 | 0 | 0 | 1 |
| 2. Authentication | 17 | 4 | 8 | 3 | 2 |
| 3. Products | 21 | 8 | 5 | 5 | 3 |
| 4. Orders | 35 | 12 | 12 | 6 | 5 |
| 5. Farmers | 16 | 7 | 5 | 3 | 1 |
| 6. Users & Admin | 18 | 5 | 8 | 2 | 3 |
| 7. Cart & Checkout | 19 | 12 | 4 | 0 | 3 |
| 8. Order Tracking | 9 | 4 | 3 | 0 | 2 |
| 9. Security & Edge Cases | 22 | 2 | 0 | 12 | 8 |
| **Total** | **163** | **59** | **45** | **31** | **28** |
