/*
# Add inventory columns to existing products table

## Overview
The products table already existed with a simple schema for the storefront.
We need to add inventory-specific columns to support the full Retailpoint import.

## Changes to products table
- numref (text, unique) — Retailpoint product reference
- category (text) — FEMME, HOMME, FILLE, GARCON, UNISEXE
- department (text) — CHAUSSURE, CHANDAIL, PANTALON, etc.
- sub_department (text) — POLY, ESPADRILLE, etc.
- supplier (text) — UNDER ARMOUR, PUMA, etc.
- season (text) — PRINTEMPS 25, AUTOMNE 25, etc.
- description_fr (text)
- description_en (text)
- description_web (text)
- keywords (text)
- tax_tps (numeric) — federal tax
- tax_tvq (numeric) — provincial tax
- updated_at (timestamptz)
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS numref text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS department text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_department text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS season text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_fr text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_web text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_tps numeric DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_tvq numeric DEFAULT 9.975;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add unique constraint on numref (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_numref ON products(numref) WHERE numref IS NOT NULL;
