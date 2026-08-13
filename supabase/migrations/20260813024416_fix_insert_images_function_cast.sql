CREATE OR REPLACE FUNCTION insert_product_images_batch(images jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count integer;
BEGIN
  INSERT INTO product_images (product_id, numref, image_number, filename, ftp_path, image_url)
  SELECT
    (img->>'product_id')::uuid,
    img->>'numref',
    (img->>'image_number')::integer,
    img->>'filename',
    NULL,
    img->>'image_url'
  FROM jsonb_array_elements(images) AS img
  WHERE NOT EXISTS (
    SELECT 1 FROM product_images pi
    WHERE pi.numref = img->>'numref'
      AND pi.image_number = (img->>'image_number')::integer
  );
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;