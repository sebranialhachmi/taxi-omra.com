
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role_ar text,
  role_en text,
  quote_ar text NOT NULL,
  quote_en text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  avatar_url text,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read testimonials" ON public.testimonials FOR SELECT USING (published = true);
CREATE POLICY "staff read all testimonials" ON public.testimonials FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER testimonials_updated BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.seo_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  meta_title text,
  meta_description text,
  og_image_url text,
  robots text DEFAULT 'index,follow',
  json_ld jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seo_meta TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_meta TO authenticated;
GRANT ALL ON public.seo_meta TO service_role;
ALTER TABLE public.seo_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read seo" ON public.seo_meta FOR SELECT USING (true);
CREATE POLICY "staff manage seo" ON public.seo_meta FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER seo_meta_updated BEFORE UPDATE ON public.seo_meta FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.testimonials (name, role_ar, role_en, quote_ar, quote_en, rating, sort_order) VALUES
('Ahmed Al-Saud','مسافر متكرر','Frequent traveler','خدمة ممتازة وسائقون محترفون، دائماً في الوقت المحدد.','Excellent service and professional drivers, always on time.',5,1),
('Sarah Johnson','عميل شركات','Business client','خدمة نقل شركات موثوقة يعتمد عليها فريقنا يومياً.','Reliable corporate transfers, our team depends on them daily.',5,2),
('Mohammed Al-Otaibi','مقيم','Resident','أفضل شركة تاكسي جربتها في المدينة.','The best taxi company I have used in the city.',5,3);

INSERT INTO public.cms_pages (slug, page_type, title_ar, title_en, subtitle_ar, subtitle_en, body_ar, body_en, meta_title, meta_description, sort_order) VALUES
('hotel-transfer','service','نقل الفنادق','Hotel Transfers','خدمة نقل مخصصة لضيوف الفنادق','Dedicated transfer service for hotel guests','نتعاون مع الفنادق لتقديم خدمة نقل موثوقة لضيوفهم بأسعار خاصة.','We partner with hotels to provide reliable transfer service for their guests at special rates.','Hotel Transfers','Reliable hotel taxi transfers with fixed rates and professional drivers.',2),
('corporate','service','نقل الشركات','Corporate Transfers','حلول نقل للشركات والاجتماعات','Business transfer solutions','عقود شهرية وسائقون مخصصون لموظفي وضيوف الشركات.','Monthly contracts and dedicated drivers for corporate clients and their guests.','Corporate Transfers','Business taxi contracts and dedicated corporate transfer service.',3);

INSERT INTO public.faqs (question_ar, question_en, answer_ar, answer_en, sort_order) VALUES
('ما وسائل الدفع المتاحة؟','What payment methods do you accept?','نقبل الدفع نقداً وبالبطاقة والتحويل البنكي وفواتير الشركات.','We accept cash, card, bank transfer, and corporate invoices.',4);

INSERT INTO public.blog_posts (slug, title_ar, title_en, excerpt_ar, excerpt_en, content_ar, content_en, meta_title, meta_description, tags, published, published_at) VALUES
('airport-tips','نصائح لرحلة المطار','Tips for your airport trip','خطط رحلتك للمطار بذكاء','Plan your airport trip smartly','احجز مبكراً، تحقق من حركة المرور، واحتفظ برقم السائق قبل الرحلة.','Book early, check traffic, and keep your driver''s number handy before the trip.','Airport Trip Tips','Smart tips for a stress-free taxi ride to the airport.',ARRAY['airport','tips'],true, now());
