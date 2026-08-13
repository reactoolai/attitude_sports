/*
# Create inventory tables for Attitude Sport

## Overview
Creates a proper inventory schema to store products imported from the Retailpoint FTP export.
The XML export contains 297 products with 2439 SKUs total, across categories (HOMME, FEMME, FILLE, GARCON, UNISEXE),
departments (CHAUSSURE, CHANDAIL, PANTALON, etc.), suppliers (Under Armour, PUMA, BOGS, SAXX, etc.),
seasons, colors, and sizes.

## New Tables

### products
- id (uuid, primary key)
- numref (text, unique) — product reference number from Retailpoint (e.g. "1275045")
- name (text) — product description/name
- category (text) — FEMME, HOMME, FILLE, GARCON, UNISEXE
- department (text) — CHAUSSURE, CHANDAIL M.C., PANTALON, etc.
- sub_department (text) — POLY, ESPADRILLE, FULL ZIP, etc.
- supplier (text) — UNDER ARMOUR, PUMA, BOGS CANADA, etc.
- season (text) — PRINTEMPS 25, AUTOMNE 25, etc.
- description_fr (text) — French description
- description_en (text) — English description
- description_web (text) — web-specific description
- keywords (text) — search keywords
- tax_tps (numeric) — federal tax rate (5)
- tax_tvq (numeric) — provincial tax rate (9.975)
- created_at (timestamptz)
- updated_at (timestamptz)

### skus
- id (uuid, primary key)
- product_id (uuid, foreign key to products)
- sku_id (text) — the Retailpoint SKU ID (same as numref for single-SKU products)
- barcode (text) — barcode value
- size (text) — XS, S, M, L, XL, 7, 8, 9, etc.
- color (text) — NOIR, BLANC, BLEU, etc.
- quantity (integer) — stock quantity
- price (numeric) — selling price
- suggested_price (numeric) — suggested price
- date_created (date)
- date_modified (date)
- date_received (date)
- created_at (timestamptz)

### product_images
- id (uuid, primary key)
- product_id (uuid, foreign key to products)
- numref (text) — product reference to match image filenames
- image_number (integer) — image sequence number (1, 2, 3...)
- filename (text) — full filename on FTP
- ftp_path (text) — full FTP path
- image_url (text) — public URL if hosted elsewhere
- created_at (timestamptz)

## Security
- RLS enabled on all tables
- Admin-only access (TO authenticated) since this is an admin dashboard
- Full CRUD policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numref text UNIQUE NOT NULL,
  name text NOT NULL,
  category text DEFAULT '',
  department text DEFAULT '',
  sub_department text DEFAULT '',
  supplier text DEFAULT '',
  season text DEFAULT '',
  description_fr text DEFAULT '',
  description_en text DEFAULT '',
  description_web text DEFAULT '',
  keywords text DEFAULT '',
  tax_tps numeric DEFAULT 5,
  tax_tvq numeric DEFAULT 9.975,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_products" ON products;
CREATE POLICY "select_products" ON products FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_products" ON products;
CREATE POLICY "insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_products" ON products;
CREATE POLICY "update_products" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_products" ON products;
CREATE POLICY "delete_products" ON products FOR DELETE
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku_id text DEFAULT '',
  barcode text DEFAULT '',
  size text DEFAULT '',
  color text DEFAULT '',
  quantity integer DEFAULT 0,
  price numeric DEFAULT 0,
  suggested_price numeric DEFAULT 0,
  date_created date,
  date_modified date,
  date_received date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skus_product_id ON skus(product_id);
CREATE INDEX IF NOT EXISTS idx_skus_barcode ON skus(barcode);
CREATE INDEX IF NOT EXISTS idx_skus_size_color ON skus(size, color);

ALTER TABLE skus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_skus" ON skus;
CREATE POLICY "select_skus" ON skus FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_skus" ON skus;
CREATE POLICY "insert_skus" ON skus FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_skus" ON skus;
CREATE POLICY "update_skus" ON skus FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_skus" ON skus;
CREATE POLICY "delete_skus" ON skus FOR DELETE
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  numref text NOT NULL,
  image_number integer DEFAULT 1,
  filename text DEFAULT '',
  ftp_path text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_numref ON product_images(numref);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_product_images" ON product_images;
CREATE POLICY "select_product_images" ON product_images FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_product_images" ON product_images;
CREATE POLICY "insert_product_images" ON product_images FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_product_images" ON product_images;
CREATE POLICY "update_product_images" ON product_images FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_product_images" ON product_images;
CREATE POLICY "delete_product_images" ON product_images FOR DELETE
  TO authenticated USING (true);
