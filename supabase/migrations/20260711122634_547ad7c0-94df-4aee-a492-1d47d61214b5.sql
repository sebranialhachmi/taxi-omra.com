
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','email','sms','internal')),
  template TEXT,
  recipient TEXT NOT NULL,
  subject TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  related_entity TEXT,
  related_id UUID,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sending','sent','failed','cancelled')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_queue TO authenticated;
GRANT ALL ON public.notification_queue TO service_role;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY nq_staff_read ON public.notification_queue FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY nq_staff_write ON public.notification_queue FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY nq_staff_update ON public.notification_queue FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY nq_admin_delete ON public.notification_queue FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_nq_updated_at BEFORE UPDATE ON public.notification_queue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_nq_status_scheduled ON public.notification_queue (status, scheduled_for);
CREATE INDEX idx_nq_related ON public.notification_queue (related_entity, related_id);

CREATE TABLE IF NOT EXISTS public.ai_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  target_entity TEXT,
  target_id UUID,
  locale TEXT DEFAULT 'en',
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','applied')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_drafts TO authenticated;
GRANT ALL ON public.ai_drafts TO service_role;
ALTER TABLE public.ai_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY aid_staff_read ON public.ai_drafts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY aid_staff_write ON public.ai_drafts FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY aid_staff_update ON public.ai_drafts FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY aid_admin_delete ON public.ai_drafts FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_aid_updated_at BEFORE UPDATE ON public.ai_drafts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_ai_drafts_kind_status ON public.ai_drafts (kind, status);
CREATE INDEX idx_ai_drafts_target ON public.ai_drafts (target_entity, target_id);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON public.bookings (driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_pickup ON public.bookings (status, pickup_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_at ON public.bookings (pickup_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings (code);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON public.customers (tier);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers (status);
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON public.drivers (phone);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles (status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status_due ON public.invoices (status, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices (booking_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_events (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.activity_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs (entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON public.tasks (assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug_locale ON public.cms_pages (slug, locale);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_routes_slug ON public.routes (slug);
CREATE INDEX IF NOT EXISTS idx_seo_meta_path ON public.seo_meta (path);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.booking_reminders (remind_at);
