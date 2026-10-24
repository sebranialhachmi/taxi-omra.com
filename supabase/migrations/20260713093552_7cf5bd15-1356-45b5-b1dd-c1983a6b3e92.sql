
-- Scope public SELECT to only enabled/active rows; staff still see everything.

DROP POLICY IF EXISTS "homepage_sections public read" ON public.homepage_sections;
CREATE POLICY "homepage_sections public read"
  ON public.homepage_sections FOR SELECT
  TO public
  USING (enabled = true OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "seo_redirects public read" ON public.seo_redirects;
CREATE POLICY "seo_redirects public read"
  ON public.seo_redirects FOR SELECT
  TO public
  USING (active = true OR public.is_staff(auth.uid()));

-- menus has no state column; add one so drafts can exist without being public.
ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Public read menus" ON public.menus;
CREATE POLICY "Public read menus"
  ON public.menus FOR SELECT
  TO anon, authenticated
  USING (published = true OR public.is_staff(auth.uid()));
