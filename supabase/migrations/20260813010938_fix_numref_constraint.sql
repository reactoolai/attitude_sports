/*
# Fix unique constraint on products.numref

The partial unique index can't be used with ON CONFLICT.
Replace it with a full unique constraint.
*/

DROP INDEX IF EXISTS idx_products_numref;

-- Make existing numref values unique, then add constraint
ALTER TABLE products ADD CONSTRAINT products_numref_unique UNIQUE (numref);
