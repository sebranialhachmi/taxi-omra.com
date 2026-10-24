
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'operational',
  body_en TEXT NOT NULL, body_ar TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active BOOLEAN NOT NULL DEFAULT true, sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_tpl_staff_read" ON public.whatsapp_templates FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "wa_tpl_manage" ON public.whatsapp_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'dispatcher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'dispatcher'));
CREATE TRIGGER wa_tpl_updated BEFORE UPDATE ON public.whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_conv_user ON public.ai_conversations(user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_conv_own" ON public.ai_conversations FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER ai_conv_updated BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_msg_conv ON public.ai_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_msg_own" ON public.ai_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id=conversation_id AND c.user_id=auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id=conversation_id AND c.user_id=auth.uid()));

CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','responded','declined','failed')),
  sent_at TIMESTAMPTZ, responded_at TIMESTAMPTZ,
  rating INT CHECK (rating BETWEEN 1 AND 5), comment TEXT, external_url TEXT, follow_up_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rr_status ON public.review_requests(status);
CREATE INDEX rr_booking ON public.review_requests(booking_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_requests TO authenticated;
GRANT ALL ON public.review_requests TO service_role;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rr_staff_read" ON public.review_requests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "rr_staff_manage" ON public.review_requests FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER rr_updated BEFORE UPDATE ON public.review_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('birthday','holiday','vip','inactive','coupon','review','custom')),
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  template_code TEXT REFERENCES public.whatsapp_templates(code),
  schedule_type TEXT NOT NULL DEFAULT 'manual' CHECK (schedule_type IN ('manual','recurring','one_off')),
  cron_expression TEXT, scheduled_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true, last_run_at TIMESTAMPTZ, next_run_at TIMESTAMPTZ,
  stats JSONB NOT NULL DEFAULT '{"sent":0,"skipped":0,"failed":0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mc_staff_read" ON public.marketing_campaigns FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "mc_manage" ON public.marketing_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER mc_updated BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.pricing_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('airport_surcharge','night_trip','holiday','high_demand','distance','custom')),
  name TEXT NOT NULL, description TEXT,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_amount NUMERIC(10,2), suggested_percent NUMERIC(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_suggestions TO authenticated;
GRANT ALL ON public.pricing_suggestions TO service_role;
ALTER TABLE public.pricing_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_staff_read" ON public.pricing_suggestions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "ps_manage" ON public.pricing_suggestions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER ps_updated BEFORE UPDATE ON public.pricing_suggestions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok','degraded','error')),
  latency_ms INT, message TEXT, metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX shc_recent ON public.system_health_checks(component, created_at DESC);
GRANT SELECT, INSERT ON public.system_health_checks TO authenticated;
GRANT ALL ON public.system_health_checks TO service_role;
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shc_admin_read" ON public.system_health_checks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "shc_admin_write" ON public.system_health_checks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

INSERT INTO public.whatsapp_templates (code, name, category, body_en, body_ar, variables, sort_order) VALUES
  ('booking_confirmation','Booking Confirmation','operational',
    E'Dear {{name}},\n\nYour booking {{code}} is confirmed.\nPickup: {{pickup}}\nDropoff: {{dropoff}}\nDate: {{datetime}}\n\nThank you for choosing us.',
    E'عزيزي {{name}}،\n\nتم تأكيد حجزك {{code}}.\nنقطة الانطلاق: {{pickup}}\nالوجهة: {{dropoff}}\nالوقت: {{datetime}}\n\nشكرًا.',
    ARRAY['name','code','pickup','dropoff','datetime'], 10),
  ('driver_assigned','Driver Assigned','operational',
    E'Hi {{name}}, your driver {{driver_name}} ({{plate}}) has been assigned to booking {{code}}. He will contact you shortly.',
    E'مرحبًا {{name}}، تم تعيين السائق {{driver_name}} ({{plate}}) لحجزك {{code}}.',
    ARRAY['name','driver_name','plate','code'], 20),
  ('driver_arriving','Driver Arriving','operational',
    E'{{name}}, your driver {{driver_name}} is arriving in ~{{eta}} minutes. Vehicle: {{vehicle}} ({{plate}}).',
    E'{{name}}، السائق {{driver_name}} سيصل خلال {{eta}} دقيقة. المركبة: {{vehicle}} ({{plate}}).',
    ARRAY['name','driver_name','eta','vehicle','plate'], 30),
  ('trip_started','Trip Started','operational',
    E'Your trip {{code}} has started. Safe journey!',
    E'بدأت رحلتك {{code}}. رحلة آمنة!',
    ARRAY['code'], 40),
  ('trip_completed','Trip Completed','operational',
    E'Thank you {{name}}. Your trip {{code}} is complete. Total: {{total}} {{currency}}.',
    E'شكرًا {{name}}. اكتملت رحلتك {{code}}. الإجمالي: {{total}} {{currency}}.',
    ARRAY['name','code','total','currency'], 50),
  ('payment_reminder','Payment Reminder','financial',
    E'Dear {{name}}, invoice {{invoice}} of {{total}} {{currency}} is due on {{due_date}}.',
    E'عزيزي {{name}}، الفاتورة {{invoice}} بمبلغ {{total}} {{currency}} مستحقة في {{due_date}}.',
    ARRAY['name','invoice','total','currency','due_date'], 60),
  ('invoice_sent','Invoice Sent','financial',
    E'Hi {{name}}, invoice {{invoice}} ({{total}} {{currency}}) has been issued. Link: {{link}}',
    E'مرحبًا {{name}}، تم إصدار الفاتورة {{invoice}} ({{total}} {{currency}}). {{link}}',
    ARRAY['name','invoice','total','currency','link'], 70),
  ('booking_reminder','Booking Reminder','operational',
    E'Reminder: booking {{code}} tomorrow at {{time}} from {{pickup}}.',
    E'تذكير: حجزك {{code}} غدًا الساعة {{time}} من {{pickup}}.',
    ARRAY['code','time','pickup'], 80),
  ('thank_you','Thank-You Message','marketing',
    E'Thank you {{name}} for choosing us. We hope to serve you again soon.',
    E'شكرًا {{name}} لاختيار خدمتنا.',
    ARRAY['name'], 90),
  ('review_request','Review Request','marketing',
    E'Hi {{name}}, we hope your ride went well. Would you share a quick review? {{link}}',
    E'مرحبًا {{name}}، هل يمكنك مشاركتنا تقييمك؟ {{link}}',
    ARRAY['name','link'], 100)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE VIEW public.v_customer_intelligence AS
SELECT
  c.id AS customer_id,
  c.total_spent AS lifetime_value,
  c.total_trips,
  c.avg_booking_value AS average_spend,
  c.favorite_pickup, c.favorite_dropoff, c.favorite_category_id,
  (SELECT EXTRACT(HOUR FROM pickup_at)::int FROM public.bookings b WHERE b.customer_id=c.id GROUP BY EXTRACT(HOUR FROM pickup_at) ORDER BY count(*) DESC LIMIT 1) AS preferred_pickup_hour,
  (SELECT p.method::text FROM public.payments p JOIN public.bookings b ON b.id=p.booking_id WHERE b.customer_id=c.id GROUP BY p.method ORDER BY count(*) DESC LIMIT 1) AS preferred_payment_method,
  CASE WHEN c.total_trips > 0 THEN round((c.cancelled_trips::numeric / c.total_trips) * 100, 2) ELSE 0 END AS cancellation_rate,
  c.last_booking_at,
  (SELECT min(pickup_at) FROM public.bookings b WHERE b.customer_id=c.id AND b.pickup_at > now() AND b.status NOT IN ('cancelled','no_show')) AS next_booking_at,
  LEAST(100, GREATEST(0,
    (COALESCE(c.total_spent,0) / NULLIF((SELECT max(total_spent) FROM public.customers),0) * 60)::int
    + (c.completed_trips * 2)
    + CASE WHEN c.tier='vip' THEN 20 WHEN c.tier='corporate' THEN 15 ELSE 0 END
  )) AS vip_score,
  LEAST(100, GREATEST(0,
    (CASE WHEN c.total_trips > 0 THEN (c.cancelled_trips::numeric / c.total_trips) * 60 ELSE 0 END)::int
    + (c.no_show_trips * 10)
    + CASE WHEN c.tier='blacklisted' THEN 40 ELSE 0 END
  )) AS risk_score
FROM public.customers c;
GRANT SELECT ON public.v_customer_intelligence TO authenticated;

CREATE OR REPLACE VIEW public.v_driver_intelligence AS
SELECT
  d.id AS driver_id, d.total_trips, d.completed_trips, d.cancelled_trips,
  d.total_earnings AS revenue_generated,
  CASE WHEN d.total_trips > 0 THEN round((d.completed_trips::numeric / d.total_trips) * 100, 2) ELSE 0 END AS completion_rate,
  CASE WHEN d.total_trips > 0 THEN round((d.cancelled_trips::numeric / d.total_trips) * 100, 2) ELSE 0 END AS cancellation_rate,
  (SELECT count(*) FROM public.bookings b WHERE b.driver_id=d.id AND b.pickup_at::date = current_date) AS trips_today,
  (SELECT count(*) FROM public.bookings b WHERE b.driver_id=d.id AND b.pickup_at >= date_trunc('month', current_date)) AS trips_this_month,
  d.rating AS average_rating,
  LEAST(100, GREATEST(0,
    (CASE WHEN d.total_trips > 0 THEN (d.completed_trips::numeric / d.total_trips) * 50 ELSE 0 END)::int
    + (COALESCE(d.rating,0) * 8)::int
    + LEAST(30, d.completed_trips / 10)
  )) AS performance_score
FROM public.drivers d;
GRANT SELECT ON public.v_driver_intelligence TO authenticated;

CREATE OR REPLACE VIEW public.v_fleet_intelligence AS
SELECT
  v.id AS vehicle_id,
  (SELECT count(*) FROM public.bookings b WHERE b.vehicle_id=v.id AND b.status='completed') AS total_trips,
  (SELECT coalesce(sum(total_fare),0) FROM public.bookings b WHERE b.vehicle_id=v.id AND b.status='completed') AS revenue,
  (SELECT coalesce(sum(cost),0) FROM public.vehicle_maintenance m WHERE m.vehicle_id=v.id) AS maintenance_cost,
  (SELECT coalesce(sum(amount),0) FROM public.expenses e WHERE e.vehicle_id=v.id AND e.category='fuel') AS fuel_cost,
  (SELECT min(next_due_date) FROM public.vehicle_maintenance m WHERE m.vehicle_id=v.id AND m.next_due_date > current_date) AS next_maintenance,
  CASE
    WHEN (SELECT count(*) FROM public.bookings b WHERE b.vehicle_id=v.id AND b.pickup_at >= now() - interval '30 days') > 0
    THEN round(((SELECT count(*)::numeric FROM public.bookings b WHERE b.vehicle_id=v.id AND b.pickup_at >= now() - interval '30 days') / 30) * 100 / 4, 2)
    ELSE 0
  END AS utilization_pct
FROM public.vehicles v;
GRANT SELECT ON public.v_fleet_intelligence TO authenticated;
