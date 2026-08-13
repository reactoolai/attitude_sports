-- Allow public (anon) read access to product_images
CREATE POLICY "public_select_product_images"
  ON product_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public (anon) read access to skus
CREATE POLICY "public_select_skus"
  ON skus FOR SELECT
  TO anon, authenticated
  USING (true);