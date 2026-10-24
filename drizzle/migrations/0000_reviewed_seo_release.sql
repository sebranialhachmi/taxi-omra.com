CREATE EXTENSION IF NOT EXISTS pg_cron;
ALTER TABLE public.cms_pages ADD COLUMN IF NOT EXISTS seo_released boolean NOT NULL DEFAULT false;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS seo_released boolean NOT NULL DEFAULT false;
CREATE TABLE public.seo_release_settings (id boolean PRIMARY KEY DEFAULT true CHECK(id), paused boolean NOT NULL DEFAULT false, next_release_at timestamptz NOT NULL DEFAULT (date_trunc('day',now())+interval '3 days 6 hours'),last_released_at timestamptz);
GRANT SELECT ON public.seo_release_settings TO authenticated;
GRANT UPDATE(paused) ON public.seo_release_settings TO authenticated;
GRANT ALL ON public.seo_release_settings TO service_role;
ALTER TABLE public.seo_release_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY seo_settings_read ON public.seo_release_settings FOR SELECT TO authenticated USING(public.has_permission(auth.uid(),'seo.view'));
CREATE POLICY seo_settings_edit ON public.seo_release_settings FOR UPDATE TO authenticated USING(public.has_permission(auth.uid(),'seo.approve')) WITH CHECK(public.has_permission(auth.uid(),'seo.approve'));
CREATE TABLE public.seo_release_queue(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),entity_type text NOT NULL CHECK(entity_type IN ('cms','blog')),content_id uuid NOT NULL,slug text NOT NULL,title_ar text NOT NULL,title_en text NOT NULL,path text NOT NULL,status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','ready','released','consolidated')),priority integer NOT NULL DEFAULT 100 CHECK(priority BETWEEN 1 AND 999),checks jsonb NOT NULL DEFAULT '{}',competitor_urls text[] NOT NULL DEFAULT '{}',advantage text NOT NULL DEFAULT '',notes text NOT NULL DEFAULT '',approved_revision text,approved_by uuid,approved_at timestamptz,released_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(entity_type,content_id));
GRANT SELECT ON public.seo_release_queue TO authenticated;
GRANT UPDATE(status,priority,checks,competitor_urls,advantage,notes) ON public.seo_release_queue TO authenticated;
GRANT ALL ON public.seo_release_queue TO service_role;
ALTER TABLE public.seo_release_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY seo_queue_read ON public.seo_release_queue FOR SELECT TO authenticated USING(public.has_permission(auth.uid(),'seo.view'));
CREATE POLICY seo_queue_write ON public.seo_release_queue FOR UPDATE TO authenticated USING(public.has_permission(auth.uid(),'seo.approve')) WITH CHECK(public.has_permission(auth.uid(),'seo.approve'));
CREATE INDEX seo_queue_due ON public.seo_release_queue(priority,approved_at) WHERE status='ready';
CREATE FUNCTION public.seo_content_revision(_type text,_id uuid) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE r jsonb; BEGIN IF _type='cms' THEN SELECT to_jsonb(p)-'updated_at'-'seo_released'-'robots' INTO r FROM public.cms_pages p WHERE id=_id AND published AND deleted_at IS NULL; ELSE SELECT to_jsonb(p)-'updated_at'-'seo_released' INTO r FROM public.blog_posts p WHERE id=_id AND published; END IF; RETURN md5(r::text); END $$;
REVOKE ALL ON FUNCTION public.seo_content_revision(text,uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.validate_seo_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a text; e text; k text; BEGIN
IF TG_OP='UPDATE' AND (NEW.entity_type<>OLD.entity_type OR NEW.content_id<>OLD.content_id OR NEW.path<>OLD.path OR NEW.slug<>OLD.slug) THEN RAISE EXCEPTION 'Content identity cannot change'; END IF;
IF TG_OP='UPDATE' AND OLD.status='consolidated' AND NEW.status<>'consolidated' THEN RAISE EXCEPTION 'Duplicate content cannot be released'; END IF;
IF NEW.status='released' AND auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'Only scheduler may release content'; END IF;
IF NEW.status='ready' THEN
IF NOT public.has_permission(auth.uid(),'seo.approve') THEN RAISE EXCEPTION 'Approval permission required'; END IF;
FOREACH k IN ARRAY ARRAY['facts','prices','unique','bilingual','images','links','competitors'] LOOP IF coalesce(NEW.checks->>k,'false')<>'true' THEN RAISE EXCEPTION 'Complete every quality check'; END IF; END LOOP;
IF cardinality(NEW.competitor_urls)<2 OR length(trim(NEW.advantage))<40 OR EXISTS(SELECT 1 FROM unnest(NEW.competitor_urls) u WHERE u !~ '^https://') THEN RAISE EXCEPTION 'Document two competitors and a concrete advantage'; END IF;
IF NEW.entity_type='cms' THEN SELECT body_ar,body_en INTO a,e FROM public.cms_pages WHERE id=NEW.content_id AND published AND deleted_at IS NULL; ELSE SELECT content_ar,content_en INTO a,e FROM public.blog_posts WHERE id=NEW.content_id AND published; END IF;
IF length(regexp_replace(coalesce(a,''),'<[^>]*>','','g'))<1000 OR length(regexp_replace(coalesce(e,''),'<[^>]*>','','g'))<1000 THEN RAISE EXCEPTION 'Both languages need substantive content'; END IF;
NEW.approved_revision:=public.seo_content_revision(NEW.entity_type,NEW.content_id); IF NEW.approved_revision IS NULL THEN RAISE EXCEPTION 'Published content missing'; END IF; NEW.approved_by:=auth.uid();NEW.approved_at:=now();
ELSIF NEW.status='pending' THEN NEW.approved_revision:=NULL;NEW.approved_at:=NULL;NEW.approved_by:=NULL; END IF; NEW.updated_at:=now();RETURN NEW; END $$;
CREATE TRIGGER validate_seo_review BEFORE INSERT OR UPDATE ON public.seo_release_queue FOR EACH ROW EXECUTE FUNCTION public.validate_seo_review();
CREATE FUNCTION public.invalidate_seo_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.seo_released IS DISTINCT FROM OLD.seo_released AND auth.uid() IS NOT NULL THEN RAISE EXCEPTION 'Only scheduler may change search visibility'; END IF;
IF (to_jsonb(NEW)-'updated_at'-'seo_released'-'robots') IS DISTINCT FROM (to_jsonb(OLD)-'updated_at'-'seo_released'-'robots') THEN UPDATE public.seo_release_queue SET status='pending',checks='{}',approved_revision=NULL,approved_at=NULL,approved_by=NULL,released_at=NULL WHERE content_id=NEW.id AND entity_type=CASE WHEN TG_TABLE_NAME='cms_pages' THEN 'cms' ELSE 'blog' END AND status IN ('ready','released');NEW.seo_released:=false;END IF;RETURN NEW;END $$;
CREATE TRIGGER seo_revision_cms BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.invalidate_seo_review();
CREATE TRIGGER seo_revision_blog BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.invalidate_seo_review();
CREATE FUNCTION public.process_seo_release() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s public.seo_release_settings;i public.seo_release_queue;result uuid;BEGIN
IF NOT pg_try_advisory_xact_lock(782341,3) THEN RETURN NULL;END IF;
SELECT * INTO s FROM public.seo_release_settings WHERE id=true FOR UPDATE;IF NOT FOUND OR s.paused OR now()<s.next_release_at THEN RETURN NULL;END IF;
FOR i IN SELECT * FROM public.seo_release_queue WHERE status='ready' ORDER BY priority,approved_at,id LIMIT 10 FOR UPDATE LOOP
IF public.seo_content_revision(i.entity_type,i.content_id) IS DISTINCT FROM i.approved_revision THEN UPDATE public.seo_release_queue SET status='pending',checks='{}' WHERE id=i.id;CONTINUE;END IF;
IF i.entity_type='cms' THEN UPDATE public.cms_pages SET seo_released=true,robots='index,follow' WHERE id=i.content_id;ELSE UPDATE public.blog_posts SET seo_released=true WHERE id=i.content_id;END IF;
UPDATE public.seo_release_queue SET status='released',released_at=now() WHERE id=i.id;UPDATE public.seo_release_settings SET last_released_at=now(),next_release_at=now()+interval '3 days' WHERE id=true;result:=i.id;EXIT;END LOOP;RETURN result;END $$;
REVOKE ALL ON FUNCTION public.process_seo_release() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.process_seo_release() TO service_role;
INSERT INTO public.seo_release_settings(id) SELECT true WHERE NOT EXISTS(SELECT 1 FROM public.seo_release_settings);
INSERT INTO public.seo_release_queue(entity_type,content_id,slug,title_ar,title_en,path,priority)
SELECT 'cms',id,slug,title_ar,title_en,CASE page_type::text WHEN 'city' THEN '/cities/' WHEN 'airport' THEN '/airports/' WHEN 'service' THEN '/services/' WHEN 'route_page' THEN '/routes/' ELSE '/p/' END||slug,CASE WHEN slug ~ '(jeddah|makkah|madinah|taif)' THEN 30 ELSE 100 END FROM public.cms_pages WHERE published AND deleted_at IS NULL AND slug NOT IN ('airport-king-abdulaziz-international','airport-prince-mohammad-bin-abdulaziz','airport-taif-international','airport-king-khalid-international','umrah-taxi','airport-transfer-service','vip-transfer','family-transport','group-transport','hotel-transfer','jeddah-to-madinah','madinah-to-jeddah','makkah-to-jeddah','jeddah-to-makkah','makkah-to-madinah','madinah-to-makkah','makkah-to-taif','taif-to-makkah','jeddah-to-taif','king-abdulaziz-international-to-madinah','king-abdulaziz-international-to-haram-makkah','prince-mohammad-bin-abdulaziz-to-masjid-nabawi','taif-international-to-makkah');
INSERT INTO public.seo_release_queue(entity_type,content_id,slug,title_ar,title_en,path,priority)
SELECT 'blog',id,slug,title_ar,title_en,'/blog/'||slug,CASE WHEN slug ~ '(jeddah|makkah|madinah|taif)' THEN 20 ELSE 100 END FROM public.blog_posts WHERE published AND slug NOT IN ('jeddah-airport-taxi-fare','taxi-jeddah-makkah-prices','taxi-fares-saudi-guide','distance-jeddah-airport-makkah','distance-makkah-madinah','jeddah-airport-to-haram','jeddah-airport-to-madinah-transfer','makkah-to-madinah-transfer','madinah-to-makkah-transfer','madinah-airport-to-haram-transfer','taif-to-makkah-transfer','monthly-driver-with-car','vip-airport-services','umrah-step-by-step','bus-vs-taxi-madinah-makkah');