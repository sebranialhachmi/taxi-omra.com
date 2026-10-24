-- hero_slides
DROP POLICY IF EXISTS "hero_slides public read" ON public.hero_slides;
CREATE POLICY "hero_slides anon read active" ON public.hero_slides
  FOR SELECT TO anon USING (active);
CREATE POLICY "hero_slides auth read" ON public.hero_slides
  FOR SELECT TO authenticated USING (active OR public.is_staff(auth.uid()));

-- homepage_sections
DROP POLICY IF EXISTS "homepage_sections public read" ON public.homepage_sections;
CREATE POLICY "homepage_sections anon read enabled" ON public.homepage_sections
  FOR SELECT TO anon USING (enabled = true);
CREATE POLICY "homepage_sections auth read" ON public.homepage_sections
  FOR SELECT TO authenticated USING (enabled = true OR public.is_staff(auth.uid()));

-- seo_redirects
DROP POLICY IF EXISTS "seo_redirects public read" ON public.seo_redirects;
CREATE POLICY "seo_redirects anon read active" ON public.seo_redirects
  FOR SELECT TO anon USING (active = true);
CREATE POLICY "seo_redirects auth read" ON public.seo_redirects
  FOR SELECT TO authenticated USING (active = true OR public.is_staff(auth.uid()));

-- menus
DROP POLICY IF EXISTS "Public read menus" ON public.menus;
CREATE POLICY "menus anon read published" ON public.menus
  FOR SELECT TO anon USING (published = true);
CREATE POLICY "menus auth read" ON public.menus
  FOR SELECT TO authenticated USING (published = true OR public.is_staff(auth.uid()));