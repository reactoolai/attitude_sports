/*
# Add public storage policies for product-images bucket

1. Storage Policies
- Allow public read access to product-images bucket (for storefront display).
- Allow anon upload access (for image sync process).
*/

DROP POLICY IF EXISTS "Public read access for product-images" ON storage.objects;
CREATE POLICY "Public read access for product-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public upload for product-images" ON storage.objects;
CREATE POLICY "Public upload for product-images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public update for product-images" ON storage.objects;
CREATE POLICY "Public update for product-images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
