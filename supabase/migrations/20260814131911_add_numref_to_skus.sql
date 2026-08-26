ALTER TABLE skus ADD COLUMN IF NOT EXISTS numref text;

CREATE INDEX IF NOT EXISTS idx_skus_numref ON skus(numref);
