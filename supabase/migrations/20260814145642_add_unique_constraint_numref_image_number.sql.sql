/*
# Add unique constraint on (numref, image_number) for product_images

1. Changes
- Adds a unique constraint on the combination of numref + image_number
- This allows upsert operations when a manifest image doesn't have a DB id yet
- First deduplicates existing rows by keeping only the one with the lowest created_at per (numref, image_number) pair
2. Security
- No RLS changes
*/

-- Deduplicate: for each (numref, image_number) pair, keep only the oldest row
DELETE FROM product_images
WHERE id NOT IN (
  SELECT DISTINCT ON (numref, image_number) id
  FROM product_images
  ORDER BY numref, image_number, created_at ASC
);

-- Add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_numref_image_number_unique
ON public.product_images (numref, image_number);
