/*
# Add proper UNIQUE constraint on (numref, image_number) for product_images

1. Changes
- Converts the existing unique index into a proper UNIQUE constraint
- This is required for Supabase client upsert with onConflict to work correctly
- Without a proper constraint, upsert silently does INSERT instead of UPDATE
2. Security
- No RLS changes
*/

-- Drop the existing index first (it was created as an index, not a constraint)
DROP INDEX IF EXISTS idx_product_images_numref_image_number_unique;

-- Deduplicate again in case new dupes were created since last migration
DELETE FROM product_images
WHERE id NOT IN (
  SELECT DISTINCT ON (numref, image_number) id
  FROM product_images
  ORDER BY numref, image_number, created_at ASC
);

-- Create proper unique constraint
ALTER TABLE public.product_images ADD CONSTRAINT product_images_numref_image_number_key UNIQUE (numref, image_number);
