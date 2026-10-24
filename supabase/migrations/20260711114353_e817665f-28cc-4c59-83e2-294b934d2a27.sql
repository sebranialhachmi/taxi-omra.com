-- Public read access for the SEO detail pages (fleet listing + /fleet/:code).
GRANT SELECT ON public.vehicle_categories TO anon;
GRANT SELECT ON public.vehicle_category_translations TO anon;

CREATE POLICY "public read active vehicle categories"
  ON public.vehicle_categories FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "public read vehicle category translations"
  ON public.vehicle_category_translations FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicle_categories c
    WHERE c.id = vehicle_category_translations.category_id AND c.is_active = true
  ));