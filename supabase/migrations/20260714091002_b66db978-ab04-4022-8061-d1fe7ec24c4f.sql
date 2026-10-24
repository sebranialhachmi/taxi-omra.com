
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS is_announcement boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS cta_text_ar text,
  ADD COLUMN IF NOT EXISTS cta_text_en text,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS bg_color text,
  ADD COLUMN IF NOT EXISTS text_color text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_pages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS show_once boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dismissible boolean NOT NULL DEFAULT true;

-- Allow anonymous & authenticated public visitors to read only currently-active announcement banners.
DROP POLICY IF EXISTS coupons_public_announcements ON public.coupons;
CREATE POLICY coupons_public_announcements ON public.coupons
  FOR SELECT
  TO anon, authenticated
  USING (
    is_announcement = true
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
  );

GRANT SELECT ON public.coupons TO anon;
