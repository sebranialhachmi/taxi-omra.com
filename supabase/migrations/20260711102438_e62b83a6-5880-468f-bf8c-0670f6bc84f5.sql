
-- 1. Extend cms_pages with enterprise SEO fields
ALTER TABLE public.cms_pages
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS twitter_card text DEFAULT 'summary_large_image',
  ADD COLUMN IF NOT EXISTS robots text DEFAULT 'index,follow',
  ADD COLUMN IF NOT EXISTS schema_type text,
  ADD COLUMN IF NOT EXISTS custom_schema jsonb,
  ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en';

-- 2. Extend blog_posts
DO $$ BEGIN
  CREATE TYPE public.blog_status AS ENUM ('draft','scheduled','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS reading_time_min integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS status public.blog_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS keywords text[];

-- 3. blog_categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text,
  description_ar text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT ALL ON public.blog_categories TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_categories public read" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_categories staff write" ON public.blog_categories FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_category_id_fkey FOREIGN KEY (category_id)
  REFERENCES public.blog_categories(id) ON DELETE SET NULL;

-- 4. hero_slides
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL,
  subtitle_en text,
  subtitle_ar text,
  image_url text,
  cta_label_en text,
  cta_label_ar text,
  cta_href text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT ALL ON public.hero_slides TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_slides public read" ON public.hero_slides FOR SELECT USING (active OR public.is_staff(auth.uid()));
CREATE POLICY "hero_slides staff write" ON public.hero_slides FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 5. homepage_sections
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title_en text,
  title_ar text,
  subtitle_en text,
  subtitle_ar text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_sections TO anon, authenticated;
GRANT ALL ON public.homepage_sections TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.homepage_sections TO authenticated;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_sections public read" ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "homepage_sections staff write" ON public.homepage_sections FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 6. promotions
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL,
  body_en text,
  body_ar text,
  image_url text,
  badge text,
  cta_label_en text,
  cta_label_ar text,
  cta_href text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT ALL ON public.promotions TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotions public read" ON public.promotions FOR SELECT USING (
  active AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now())
  OR public.is_staff(auth.uid())
);
CREATE POLICY "promotions staff write" ON public.promotions FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 7. partners
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partners TO anon, authenticated;
GRANT ALL ON public.partners TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.partners TO authenticated;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners public read" ON public.partners FOR SELECT USING (active OR public.is_staff(auth.uid()));
CREATE POLICY "partners staff write" ON public.partners FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 8. contact_submissions (stored in CRM)
DO $$ BEGIN
  CREATE TYPE public.contact_status AS ENUM ('new','in_progress','converted','closed','spam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  subject text,
  message text NOT NULL,
  source text DEFAULT 'contact_form',
  page_url text,
  user_agent text,
  ip_hash text,
  status public.contact_status NOT NULL DEFAULT 'new',
  notes text,
  handled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  handled_at timestamptz,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_submissions public insert" ON public.contact_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "contact_submissions staff read" ON public.contact_submissions FOR SELECT
  TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "contact_submissions staff update" ON public.contact_submissions FOR UPDATE
  TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "contact_submissions staff delete" ON public.contact_submissions FOR DELETE
  TO authenticated USING (public.is_staff(auth.uid()));

-- 9. media_library
CREATE TABLE IF NOT EXISTS public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  filename text NOT NULL,
  alt_text text,
  caption text,
  content_type text,
  size_bytes bigint,
  width integer,
  height integer,
  tags text[],
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_library TO authenticated;
GRANT ALL ON public.media_library TO service_role;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_library staff all" ON public.media_library FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 10. seo_redirects
CREATE TABLE IF NOT EXISTS public.seo_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path text NOT NULL UNIQUE,
  destination_path text NOT NULL,
  status_code integer NOT NULL DEFAULT 301,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seo_redirects TO anon, authenticated;
GRANT ALL ON public.seo_redirects TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.seo_redirects TO authenticated;
ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_redirects public read" ON public.seo_redirects FOR SELECT USING (true);
CREATE POLICY "seo_redirects staff write" ON public.seo_redirects FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 11. updated_at triggers
CREATE TRIGGER trg_blog_categories_updated BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_hero_slides_updated BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_homepage_sections_updated BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_promotions_updated BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_partners_updated BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_contact_submissions_updated BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_media_library_updated BEFORE UPDATE ON public.media_library
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_seo_redirects_updated BEFORE UPDATE ON public.seo_redirects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 12. Blog reading-time auto-compute
CREATE OR REPLACE FUNCTION public.blog_compute_reading_time()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_text text; v_words int;
BEGIN
  v_text := COALESCE(NEW.content_en, NEW.content_ar, '');
  v_words := GREATEST(array_length(regexp_split_to_array(v_text, '\s+'), 1), 1);
  NEW.reading_time_min := GREATEST(1, CEIL(v_words / 220.0));
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  NEW.published := (NEW.status = 'published');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_blog_reading_time ON public.blog_posts;
CREATE TRIGGER trg_blog_reading_time BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog_compute_reading_time();

-- 13. Storage RLS for media-library
DO $$ BEGIN
  CREATE POLICY "media-library staff read" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'media-library' AND public.is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "media-library staff write" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'media-library' AND public.is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "media-library staff update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'media-library' AND public.is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "media-library staff delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'media-library' AND public.is_staff(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 14. Seed homepage sections & blog categories & one hero slide
INSERT INTO public.homepage_sections (section_key, title_en, title_ar, sort_order) VALUES
  ('hero','Chauffeur-Driven Luxury','خدمة سائق فاخر',1),
  ('benefits','Why choose us','لماذا نحن',2),
  ('services','Our Services','خدماتنا',3),
  ('fleet','Our Fleet','أسطولنا',4),
  ('pricing','Transparent Pricing','أسعار واضحة',5),
  ('testimonials','Trusted by travelers','يوصي بنا الركاب',6),
  ('stats','Numbers that matter','أرقامنا',7),
  ('blog','From the Journal','من المدونة',8),
  ('faq','Frequently Asked','الأسئلة الشائعة',9),
  ('partners','Trusted partners','شركاؤنا',10),
  ('cta','Ready to ride?','هل أنت مستعد؟',11)
ON CONFLICT (section_key) DO NOTHING;

INSERT INTO public.blog_categories (slug, name_en, name_ar) VALUES
  ('news','News','أخبار'),
  ('guides','Travel Guides','أدلة السفر'),
  ('airport','Airport','المطار'),
  ('business','Business','أعمال')
ON CONFLICT (slug) DO NOTHING;

-- Backfill blog_posts.status from published
UPDATE public.blog_posts SET status='published' WHERE published = true AND status='draft';
