## 1. Product Overview (The Pitch)

**Product Name:** Organic Oasis (v1.0.0-MVP)

**Problem Statement:** Urban consumers lack transparency regarding food origin, while small-scale organic farmers struggle with direct-to-market digital logistics and inventory management.

**Target Personas:** \* **The Conscious Consumer:** Residents seeking chemical-free, traceable produce.

- **The Independent Farmer:** Producers needing a low-tech entry point to high-tech logistics.
- **The Hub Admin:** Aggregators managing regional food clusters.

**Key Features:**

- **Visual Trust Engine:** High-fidelity harvest photos stored on private cloud (MinIO).
- **Role-Based Command:** Distinct dashboards for Farmers (Inventory/Orders) and Admins (Staff/System).
- **Real-Time Harvest Sync:** Dynamic inventory updates that bypass cache for "Morning Harvest" accuracy.

---

## 2. Architecture & Design (The Management Review)

**System Philosophy:** Cloud-native, stateless, and horizontally scalable.

**Component Responsibilities:**

- **Frontend (Next.js 14):** Server-side rendering (SSR) for SEO and Client-side hydration for the Admin Dashboard.
- **Backend (FastAPI):** High-concurrency Python engine handling Auth and Image processing.
- **Storage (MinIO):** S3-compatible object storage ensuring that large image assets do not bloat the database.

**Data Flow (Harvest Update):**

1. Farmer uploads photo → 2. Backend validates JWT → 3. Photo pushed to MinIO via **Internal K8s DNS** → 4. Metadata saved to Postgres → 5. Frontend invalidates cache to show the new item.

---

## 3. Security Documentation (The Compliance Check)

**Authentication Model:**

- **Algorithm:** RS256 / HS256 JWT.
- **Password Handling:** Industry-standard **Bcrypt** salted hashing.
- **Token Strategy:** \* **LocalStorage:** Used for UI state and Client-side API calls.
- **HttpOnly Cookies:** Used for Next.js Middleware "Bouncer" protection.

**RBAC Matrix:**
| Role | Access Level | Permissions |
| :--- | :--- | :--- |
| **Admin** | Global | User management, Global Inventory, Role Toggling |
| **Farmer** | Restricted | Own Produce Update, Own Order Viewing |
| **Public** | Guest | View Storefront, Search, Add to Cart |

---

## 4. API Documentation (The Technical Spec)

**Base URL:** `https://of.kaayaka.in/api/v1`

**Authentication:** `Authorization: Bearer <JWT_TOKEN>`

**Key Endpoint Example:**
`POST /products/upsert`

- **Type:** `multipart/form-data`
- **Payload:** `name`, `price`, `stock_qty`, `farmer_id`, `file` (image).
- **Logic:** Smart-detects if ID is present (Update) or absent (Create).

---

## 5. Deployment & Infrastructure (The Ops Manual)

**Deployment Model:** Containerized Microservices in Kubernetes.

**Networking & TLS:**

- **Ingress Controller:** Nginx.
- **Certificates:** Managed via Cert-Manager (Let's Encrypt).
- **Internal Communication:** \* `http://farm-backend:8000` (FastAPI)
- `http://minio-service:9000` (MinIO)

**Secrets Management:** Environment variables injected via K8s Secrets:

- `MINIO_ACCESS_KEY`
- `DATABASE_URL`
- `JWT_SECRET`

---

## 6. Troubleshooting & Operations (The Maintenance Guide)

**"If X happens, check Y" - The Fast Fix:**

- **Problem:** Images 404 on Storefront.
- **Check:** Verify MinIO bucket policy is `download` for anonymous users.

- **Problem:** Infinite Login Loop.
- **Check:** Clear browser cookies. Ensure Middleware and Login are using the same cookie name (`token`).

- **Problem:** "Name or service not known" in Backend.
- **Check:** Ensure the `MINIO_ENDPOINT` in K8s is using the service name, not the external URL.

**Backup Strategy:**

- **Database:** Nightly pg_dump to persistent volume.
- **Images:** MinIO bucket replication (optional) or PVC snapshots.

---

### Customer Pitch Summary

> "Organic Oasis isn't just an app; it's a **resilient infrastructure**. By leveraging Kubernetes for uptime and MinIO for data sovereignty, we offer farmers a professional-grade storefront that scales as they grow, while giving customers the visual proof of quality they demand."

**Would you like me to generate a specific "Feature Roadmap" for the next 6 months to include in the Customer Pitch (e.g., QR-code traceability, subscription models)?**

Product Documentation Checklist

1️⃣ Product Overview (Must Have)
✔ Product name & version
✔ Problem statement (what it solves)
✔ Target users / personas
✔ Key features
✔ High-level architecture diagram
✔ Supported platforms (web, mobile, API, etc.)
✔ Glossary of important terms

2️⃣ Getting Started (Critical)

✔ Prerequisites
✔ System requirements
✔ Installation / setup steps
✔ Environment setup (dev / staging / prod)
✔ First-time user walkthrough
✔ Sample configuration
✔ “Hello World” or minimal working example

3️⃣ User Documentation (Functional)

✔ User roles & permissions
✔ Feature-by-feature explanation
✔ UI screenshots / flows
✔ Common user workflows
✔ Edge cases / limitations
✔ Error messages & meanings
✔ FAQs

4️⃣ Configuration & Environment

✔ Environment variables list
✔ Config files explanation
✔ Default values
✔ Secrets management
✔ Feature flags
✔ Multi-environment setup
✔ Scaling options

Example:

DATABASE_URL – Postgres connection string
REDIS_URL – Cache backend
NODE_ENV – development | production

5️⃣ API Documentation (If Applicable)

✔ Base URL
✔ Authentication method
✔ Token lifecycle
✔ Headers
✔ Request/response examples
✔ Error codes
✔ Rate limits
✔ Pagination
✔ Webhooks (if any)

Example:

POST /api/v1/auth/login
Authorization: Bearer <token>

6️⃣ Architecture & Design (Engineering)

✔ System architecture diagram
✔ Component responsibilities
✔ Data flow
✔ Database schema
✔ Caching strategy
✔ Message queues / async processing
✔ External dependencies

7️⃣ Deployment & Infrastructure

✔ Deployment model (VM / Docker / k8s)
✔ Dockerfile explanation
✔ Kubernetes manifests
✔ Ingress / networking
✔ TLS & certificates
✔ Scaling & replicas
✔ Rollback strategy

8️⃣ Security Documentation (Very Important)

✔ Authentication & authorization model
✔ Password handling (bcrypt, etc.)
✔ Token strategy (JWT, cookies)
✔ TLS / HTTPS requirements
✔ Secrets storage
✔ RBAC roles
✔ Known security considerations

9️⃣ Observability & Debugging

✔ Logging strategy
✔ Log locations
✔ Metrics exposed
✔ Health checks
✔ Readiness / liveness probes
✔ Common failure scenarios
✔ Debugging steps

🔟 Operations & Maintenance

✔ Backup & restore
✔ Data retention policy
✔ Cleanup jobs
✔ Image cleanup strategy
✔ DB migrations
✔ Upgrade process
✔ Downtime expectations

1️⃣1️⃣ Troubleshooting Guide (Highly Valuable)

✔ Common issues
✔ Root cause explanations
✔ Step-by-step fixes
✔ Error messages mapping
✔ “If X happens, check Y”

1️⃣2️⃣ Performance & Limits

✔ Expected load
✔ Rate limits
✔ Storage limits
✔ Timeouts
✔ Known bottlenecks
✔ Scaling recommendations
