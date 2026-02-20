-- Migration: Add indexes and constraints
-- Run this on existing databases to add performance improvements
-- Note: These are idempotent (safe to run multiple times)

-- ============================================
-- INDEXES
-- ============================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS ix_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS ix_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS ix_orders_created_at ON orders(created_at);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS ix_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS ix_order_items_product_id ON order_items(product_id);

-- Products table indexes
CREATE INDEX IF NOT EXISTS ix_products_farmer_id ON products(farmer_id);
CREATE INDEX IF NOT EXISTS ix_products_name ON products(name);

-- Farmers table indexes
CREATE INDEX IF NOT EXISTS ix_farmers_name ON farmers(name);

-- Users table indexes (email already has unique index)
CREATE INDEX IF NOT EXISTS ix_users_role ON users(role);


-- ============================================
-- CHECK CONSTRAINTS
-- ============================================
-- Note: PostgreSQL doesn't support IF NOT EXISTS for constraints
-- Use DO block with exception handling

DO $$
BEGIN
    -- Orders: total_price >= 0
    ALTER TABLE orders ADD CONSTRAINT chk_orders_total_price_positive CHECK (total_price >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    -- Products: price >= 0
    ALTER TABLE products ADD CONSTRAINT chk_products_price_positive CHECK (price >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    -- Products: stock_qty >= 0
    ALTER TABLE products ADD CONSTRAINT chk_products_stock_positive CHECK (stock_qty >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    -- Order items: quantity > 0
    ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quantity_positive CHECK (quantity > 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    -- Order items: price_at_time >= 0
    ALTER TABLE order_items ADD CONSTRAINT chk_order_items_price_positive CHECK (price_at_time >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- ============================================
-- ADD is_harvested COLUMN (if not exists)
-- ============================================

DO $$
BEGIN
    ALTER TABLE order_items ADD COLUMN is_harvested BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;


-- ============================================
-- VERIFY MIGRATION
-- ============================================

-- Show all indexes
SELECT
    schemaname,
    tablename,
    indexname
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;

-- Show all check constraints
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS definition
FROM
    pg_constraint
WHERE
    contype = 'c'
    AND connamespace = 'public'::regnamespace
ORDER BY
    conrelid::regclass::text,
    conname;
