/*
# Create product-images storage bucket

1. Storage
- Create a public bucket named `product-images` to store product photos.
- The bucket is public so the storefront can display images without auth.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
