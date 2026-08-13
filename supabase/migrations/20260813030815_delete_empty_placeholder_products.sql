-- Remove 16 empty placeholder products that have no numref, no category, no supplier, no SKUs, no images
DELETE FROM products WHERE numref IS NULL;