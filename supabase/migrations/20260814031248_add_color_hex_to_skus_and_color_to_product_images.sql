/*
# Add color_hex to skus and color to product_images

1. New Columns
- `skus.color_hex` (text, nullable) — stores the hex color code (e.g. "#FF5A1F") chosen by admin via the pixel color picker, so colors display as visual circles instead of text labels.
- `product_images.color` (text, nullable, default '') — stores the color name this image is assigned to, so the storefront can filter the photo gallery by selected color.

2. Security
- No RLS policy changes needed — existing policies already cover CRUD on both tables for anon+authenticated.

3. Important Notes
- Both columns are nullable so existing rows are unaffected.
- The admin detail page will let the admin pick a pixel color for each SKU color and assign images to specific colors.
- The storefront PDP will show color circles (not text), filter the gallery by selected color, and display the product reference number.
*/

ALTER TABLE skus ADD COLUMN IF NOT EXISTS color_hex text DEFAULT '';
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS color text DEFAULT '';
