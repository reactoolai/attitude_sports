/*
# Add deleted column to product_images

1. Modified Tables
- `product_images`: add `deleted` boolean column (default false)
   - When a manifest image is deleted (no DB row), a tombstone row is inserted with deleted=true
   - On load, manifest images matching a deleted=true DB row are filtered out

2. Security
- No policy changes needed; existing policies cover the new column
*/

ALTER TABLE product_images ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;
