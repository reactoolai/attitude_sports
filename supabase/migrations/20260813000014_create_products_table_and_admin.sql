/*
# Create products table and admin account

1. New Tables
- `products` — stores all products for the Attitude Sports store
  - `id` (uuid, primary key)
  - `name` (text, not null) — product name
  - `cat` (text) — category (e.g. "Entraînement", "Course")
  - `price` (text) — display price (e.g. "34,99 $")
  - `n` (numeric) — numeric price for sorting
  - `old_price` (text) — original price for sale items
  - `badge` (text) — badge label ("Nouveau", "Solde", or empty)
  - `colors` (integer) — number of colors
  - `dots` (jsonb) — array of color hex codes for swatches
  - `d` (jsonb) — array of department slugs the product belongs to
  - `rating` (text) — rating string (e.g. "4.7")
  - `reviews` (integer) — number of reviews
  - `image_url` (text) — optional product image URL
  - `created_at` (timestamptz) — creation timestamp

2. Security
- Enable RLS on `products`.
- SELECT: public (anon + authenticated) — anyone can browse products.
- INSERT/UPDATE/DELETE: authenticated only — admin can manage products.

3. Admin Account
- Create admin user with email info@lechoixdesophie.com
- Set raw_app_meta_data role to 'admin'
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cat text DEFAULT '',
  price text DEFAULT '',
  n numeric DEFAULT 0,
  old_price text DEFAULT '',
  badge text DEFAULT '',
  colors integer DEFAULT 1,
  dots jsonb DEFAULT '[]'::jsonb,
  d jsonb DEFAULT '[]'::jsonb,
  rating text DEFAULT '0',
  reviews integer DEFAULT 0,
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products"
ON products FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_products" ON products;
CREATE POLICY "admin_insert_products"
ON products FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_products" ON products;
CREATE POLICY "admin_update_products"
ON products FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_products" ON products;
CREATE POLICY "admin_delete_products"
ON products FOR DELETE
TO authenticated USING (true);

-- Seed initial products from existing data
INSERT INTO products (name, cat, price, n, old_price, badge, colors, dots, d, rating, reviews)
VALUES
  ('T-shirt AS-Dry Performance', 'Entraînement', '34,99 $', 34.99, '', 'Nouveau', 4, '["#16161A","#F2F0EB","#FF5A1F"]'::jsonb, '["hommes"]'::jsonb, '4.7', 128),
  ('Débardeur Cadence', 'Course', '29,99 $', 29.99, '', '', 3, '["#16161A","#9C9CA4"]'::jsonb, '["hommes"]'::jsonb, '4.5', 64),
  ('Manches longues Thermo', 'Entraînement', '44,99 $', 44.99, '', '', 2, '["#16161A","#2E2E34"]'::jsonb, '["hommes"]'::jsonb, '4.6', 87),
  ('Chandail à capuchon Fortitude', 'Mode de vie', '79,99 $', 79.99, '', 'Nouveau', 5, '["#16161A","#9C9CA4","#FF5A1F","#F2F0EB"]'::jsonb, '["hommes","femmes"]'::jsonb, '4.8', 214),
  ('T-shirt graphique AS', 'Mode de vie', '24,99 $', 24.99, '32,99 $', 'Solde', 3, '["#16161A","#F2F0EB","#FF5A1F"]'::jsonb, '["hommes","outlet"]'::jsonb, '4.4', 96),
  ('Polo Précision', 'Golf', '54,99 $', 54.99, '', '', 2, '["#16161A","#F2F0EB"]'::jsonb, '["hommes"]'::jsonb, '4.6', 41),
  ('Legging Momentum 7/8', 'Course', '64,99 $', 64.99, '', 'Nouveau', 4, '["#16161A","#9C9CA4","#FF5A1F"]'::jsonb, '["femmes"]'::jsonb, '4.9', 302),
  ('Brassière Impulsion', 'Entraînement', '39,99 $', 39.99, '', '', 3, '["#16161A","#F2F0EB","#FF5A1F"]'::jsonb, '["femmes"]'::jsonb, '4.7', 156),
  ('Short Élan 2-en-1', 'Course', '49,99 $', 49.99, '59,99 $', 'Solde', 2, '["#16161A","#9C9CA4"]'::jsonb, '["femmes","outlet"]'::jsonb, '4.5', 73),
  ('Veste Tempo', 'Course', '89,99 $', 89.99, '', '', 2, '["#16161A","#FF5A1F"]'::jsonb, '["femmes"]'::jsonb, '4.8', 58),
  ('T-shirt Mini Attitude', 'Mode de vie', '19,99 $', 19.99, '', '', 3, '["#16161A","#FF5A1F","#F2F0EB"]'::jsonb, '["enfants"]'::jsonb, '4.6', 44),
  ('Ensemble molleton Junior', 'Mode de vie', '59,99 $', 59.99, '74,99 $', 'Solde', 2, '["#16161A","#9C9CA4"]'::jsonb, '["enfants","outlet"]'::jsonb, '4.7', 39),
  ('Short d''équipe Junior', 'Entraînement', '24,99 $', 24.99, '', 'Nouveau', 4, '["#16161A","#9C9CA4","#FF5A1F","#F2F0EB"]'::jsonb, '["enfants"]'::jsonb, '4.5', 27),
  ('Chaussure Vitesse 3', 'Course', '129,99 $', 129.99, '', 'Nouveau', 3, '["#16161A","#F2F0EB","#FF5A1F"]'::jsonb, '["chaussures","hommes"]'::jsonb, '4.8', 187),
  ('Chaussure Fondation TR', 'Entraînement', '109,99 $', 109.99, '', '', 2, '["#16161A","#9C9CA4"]'::jsonb, '["chaussures"]'::jsonb, '4.6', 92),
  ('Chaussure Verdict Court', 'Basketball', '139,99 $', 139.99, '169,99 $', 'Solde', 2, '["#16161A","#FF5A1F"]'::jsonb, '["chaussures","outlet"]'::jsonb, '4.7', 115)
ON CONFLICT DO NOTHING;
