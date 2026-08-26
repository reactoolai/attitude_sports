/*
# Allow anon to insert product_images (for manifest sync on first load)
*/
CREATE POLICY "anon_insert_product_images" ON product_images FOR INSERT
  TO anon WITH CHECK (true);
