
-- Phase C: CMS Management foundation

-- 1. Content status enum (draft/published/archived)
DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extend cms_pages with gallery, featured image, twitter, related, soft-delete, status
ALTER TABLE public.cms_pages
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS twitter_title text,
  ADD COLUMN IF NOT EXISTS twitter_description text,
  ADD COLUMN IF NOT EXISTS twitter_image_url text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Backfill status from published where still default
UPDATE public.cms_pages SET status='published' WHERE published=true AND status='draft';

-- Keep published in sync with status
CREATE OR REPLACE FUNCTION public.trg_cms_pages_status_sync()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  NEW.published := (NEW.status = 'published');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS cms_pages_status_sync ON public.cms_pages;
CREATE TRIGGER cms_pages_status_sync BEFORE INSERT OR UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.trg_cms_pages_status_sync();

CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON public.cms_pages(status);
CREATE INDEX IF NOT EXISTS idx_cms_pages_deleted_at ON public.cms_pages(deleted_at);

-- 3. Extend testimonials with SEO/status/soft-delete
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS location_ar text,
  ADD COLUMN IF NOT EXISTS location_en text;

UPDATE public.testimonials SET status='published' WHERE published=true AND status='draft';

-- 4. Extend routes with slug, bilingual, SEO, status
ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS title_ar text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS twitter_title text,
  ADD COLUMN IF NOT EXISTS twitter_description text,
  ADD COLUMN IF NOT EXISTS twitter_image_url text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS robots text DEFAULT 'index,follow',
  ADD COLUMN IF NOT EXISTS schema_type text,
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_routes_slug ON public.routes(slug) WHERE slug IS NOT NULL;

-- 5. Extend vehicle_categories with status/SEO where missing
ALTER TABLE public.vehicle_categories
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status public.content_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 6. Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  role_ar text,
  role_en text,
  bio_ar text,
  bio_en text,
  photo_url text,
  email text,
  phone text,
  linkedin_url text,
  sort_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  meta_title text,
  meta_description text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published team members" ON public.team_members
  FOR SELECT TO anon USING (status = 'published' AND deleted_at IS NULL);
CREATE POLICY "Staff read team" ON public.team_members
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage team" ON public.team_members
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Menus
CREATE TABLE IF NOT EXISTS public.menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.menus TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menus TO authenticated;
GRANT ALL ON public.menus TO service_role;

ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read menus" ON public.menus FOR SELECT TO anon USING (true);
CREATE POLICY "Staff manage menus" ON public.menus FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER menus_updated_at BEFORE UPDATE ON public.menus
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE,
  label_ar text NOT NULL,
  label_en text NOT NULL,
  url text NOT NULL,
  target text NOT NULL DEFAULT '_self',
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active menu items" ON public.menu_items FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Staff read menu items" ON public.menu_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff manage menu items" ON public.menu_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER menu_items_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_menu_items_menu ON public.menu_items(menu_id, sort_order);

-- 8. Seed default menus
INSERT INTO public.menus (location, name, description) VALUES
  ('header', 'Header Menu', 'Primary public site header navigation'),
  ('footer', 'Footer Menu', 'Public site footer links')
ON CONFLICT (location) DO NOTHING;
