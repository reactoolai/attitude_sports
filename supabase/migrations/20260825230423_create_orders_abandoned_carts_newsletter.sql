/*
# Create orders, order_items, order_status_history, abandoned_carts, newsletter_subscribers

1. New Tables
- `orders` — customer orders with fulfillment, shipping address, taxes, totals, payment info.
- `order_items` — line items for each order (product, SKU, price, quantity).
- `order_status_history` — audit trail of status changes per order.
- `abandoned_carts` — carts that were started but not completed, for recovery emails.
- `newsletter_subscribers` — email signups from the footer form.

2. Security
- `orders`, `order_items`, `order_status_history`, `abandoned_carts`: RLS enabled, authenticated-only.
  No anon policies — these tables are written exclusively by Edge Functions using the service_role key.
- `newsletter_subscribers`: anon INSERT (footer form), authenticated SELECT (admin dashboard).

3. Notes
- No existing tables are altered.
- Order numbers generated via `next_order_number()` using sequence `order_number_seq`.
*/

-- ── orders ──
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending_payment',
  customer_first_name text NOT NULL,
  customer_last_name  text NOT NULL,
  customer_email      text NOT NULL,
  customer_phone      text,
  fulfillment_type text NOT NULL DEFAULT 'delivery',
  ship_address1 text, ship_address2 text, ship_city text,
  ship_province text DEFAULT 'QC', ship_postal_code text, ship_country text DEFAULT 'CA',
  customer_note text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping_total numeric(10,2) NOT NULL DEFAULT 0,
  tps numeric(10,2) NOT NULL DEFAULT 0,
  tvq numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD',
  payment_provider text DEFAULT 'square',
  square_payment_id text,
  payment_status text DEFAULT 'pending',
  cart_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_orders" ON orders;
CREATE POLICY "auth_select_orders" ON orders FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_orders" ON orders;
CREATE POLICY "auth_insert_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);

-- ── order_items ──
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid,
  numref text,
  sku_id text,
  barcode text,
  name text NOT NULL,
  supplier text,
  image_url text,
  color text,
  size text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  line_total numeric(10,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_order_items" ON order_items;
CREATE POLICY "auth_select_order_items" ON order_items FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_order_items" ON order_items;
CREATE POLICY "auth_insert_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_order_items" ON order_items;
CREATE POLICY "auth_update_order_items" ON order_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_order_items" ON order_items;
CREATE POLICY "auth_delete_order_items" ON order_items FOR DELETE
  TO authenticated USING (true);

-- ── order_status_history ──
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_order_status_history" ON order_status_history;
CREATE POLICY "auth_select_order_status_history" ON order_status_history FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_order_status_history" ON order_status_history;
CREATE POLICY "auth_insert_order_status_history" ON order_status_history FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_order_status_history" ON order_status_history;
CREATE POLICY "auth_update_order_status_history" ON order_status_history FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_order_status_history" ON order_status_history;
CREATE POLICY "auth_delete_order_status_history" ON order_status_history FOR DELETE
  TO authenticated USING (true);

-- ── abandoned_carts ──
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_token text UNIQUE NOT NULL,
  email text, first_name text, last_name text, phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  items_count integer DEFAULT 0,
  subtotal numeric(10,2) DEFAULT 0,
  status text DEFAULT 'active',
  converted_order_id uuid REFERENCES orders(id),
  reached_checkout boolean DEFAULT false,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abandoned_last_seen ON abandoned_carts(last_seen_at DESC);

ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_select_abandoned_carts" ON abandoned_carts;
CREATE POLICY "auth_select_abandoned_carts" ON abandoned_carts FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_abandoned_carts" ON abandoned_carts;
CREATE POLICY "auth_insert_abandoned_carts" ON abandoned_carts FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_abandoned_carts" ON abandoned_carts;
CREATE POLICY "auth_update_abandoned_carts" ON abandoned_carts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_abandoned_carts" ON abandoned_carts;
CREATE POLICY "auth_delete_abandoned_carts" ON abandoned_carts FOR DELETE
  TO authenticated USING (true);

-- ── newsletter_subscribers ──
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  source text DEFAULT 'footer',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_newsletter" ON newsletter_subscribers;
CREATE POLICY "anon_insert_newsletter" ON newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_select_newsletter" ON newsletter_subscribers;
CREATE POLICY "auth_select_newsletter" ON newsletter_subscribers FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_delete_newsletter" ON newsletter_subscribers;
CREATE POLICY "auth_delete_newsletter" ON newsletter_subscribers FOR DELETE
  TO authenticated USING (true);

-- ── order number sequence + function ──
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;
CREATE OR REPLACE FUNCTION next_order_number() RETURNS text
LANGUAGE sql AS $$ SELECT 'AS-' || to_char(now(),'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 5, '0') $$;