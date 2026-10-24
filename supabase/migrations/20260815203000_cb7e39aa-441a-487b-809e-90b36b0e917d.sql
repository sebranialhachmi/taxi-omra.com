ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS meta_title_ar text,
  ADD COLUMN IF NOT EXISTS meta_description_ar text,
  ADD COLUMN IF NOT EXISTS primary_keyword_en text,
  ADD COLUMN IF NOT EXISTS primary_keyword_ar text,
  ADD COLUMN IF NOT EXISTS cover_alt_en text,
  ADD COLUMN IF NOT EXISTS cover_alt_ar text,
  ADD COLUMN IF NOT EXISTS cover_caption text,
  ADD COLUMN IF NOT EXISTS content_format text NOT NULL DEFAULT 'text';

ALTER TABLE public.media_library
  ADD COLUMN IF NOT EXISTS alt_text_ar text;