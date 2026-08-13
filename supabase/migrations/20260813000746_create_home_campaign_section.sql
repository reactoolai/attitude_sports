/*
# Create editable home campaign section

1. New Tables
- `home_campaigns` — stores the single promotional section displayed after the homepage hero.
  - `id` (text, primary key) — fixed key for the homepage campaign.
  - `eyebrow` (text) — small label above the main title.
  - `title` (text) — campaign headline.
  - `description` (text) — supporting campaign copy.
  - `image_url` (text) — image used by the campaign section.
  - `men_label` (text) — label for the men's button.
  - `men_link` (text) — internal route for the men's button.
  - `women_label` (text) — label for the women's button.
  - `women_link` (text) — internal route for the women's button.
  - `enabled` (boolean) — controls whether the section is displayed.
  - `updated_at` (timestamptz) — last update timestamp.

2. Security
- Enable RLS on `home_campaigns`.
- Allow anonymous and authenticated visitors to read the enabled campaign.
- Allow only authenticated users whose immutable app metadata role is `admin` to insert, update, or delete the campaign.
- Tighten existing product write policies so signed-in non-admin users cannot manage products.

3. Important Notes
- The fixed `id` keeps this feature as one editable homepage section instead of allowing duplicate campaigns.
- The initial image points to the already-provided `/images/back_to_school.png` asset.
*/

CREATE TABLE IF NOT EXISTS public.home_campaigns (
  id text PRIMARY KEY,
  eyebrow text NOT NULL DEFAULT 'Rentrée 2026',
  title text NOT NULL DEFAULT 'Bouge avec confiance',
  description text NOT NULL DEFAULT 'La rentrée commence avec une attitude qui te ressemble.',
  image_url text NOT NULL DEFAULT '/images/back_to_school.png',
  men_label text NOT NULL DEFAULT 'Magasiner hommes',
  men_link text NOT NULL DEFAULT '#/hommes',
  women_label text NOT NULL DEFAULT 'Magasiner femmes',
  women_link text NOT NULL DEFAULT '#/femmes',
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.home_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_enabled_home_campaign" ON public.home_campaigns;
CREATE POLICY "public_select_enabled_home_campaign"
ON public.home_campaigns FOR SELECT
TO anon, authenticated
USING (enabled = true OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_insert_home_campaign" ON public.home_campaigns;
CREATE POLICY "admin_insert_home_campaign"
ON public.home_campaigns FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_update_home_campaign" ON public.home_campaigns;
CREATE POLICY "admin_update_home_campaign"
ON public.home_campaigns FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_delete_home_campaign" ON public.home_campaigns;
CREATE POLICY "admin_delete_home_campaign"
ON public.home_campaigns FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

INSERT INTO public.home_campaigns (id)
VALUES ('homepage-main')
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
CREATE POLICY "admin_insert_products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_update_products" ON public.products;
CREATE POLICY "admin_update_products"
ON public.products FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin_delete_products" ON public.products;
CREATE POLICY "admin_delete_products"
ON public.products FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
