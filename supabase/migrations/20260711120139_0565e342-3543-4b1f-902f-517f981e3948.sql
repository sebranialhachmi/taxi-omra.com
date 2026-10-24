
-- Extend bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS priority_level SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_category TEXT;

-- Extend contact_submissions
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_channel TEXT;

-- booking_notes
CREATE TABLE IF NOT EXISTS public.booking_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_notes TO authenticated;
GRANT ALL ON public.booking_notes TO service_role;
ALTER TABLE public.booking_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_notes staff read"   ON public.booking_notes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "booking_notes staff insert" ON public.booking_notes FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "booking_notes staff update" ON public.booking_notes FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "booking_notes admin delete" ON public.booking_notes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_booking_notes_booking ON public.booking_notes(booking_id, created_at DESC);
CREATE TRIGGER booking_notes_updated BEFORE UPDATE ON public.booking_notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- booking_attachments
CREATE TABLE IF NOT EXISTS public.booking_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_attachments TO authenticated;
GRANT ALL ON public.booking_attachments TO service_role;
ALTER TABLE public.booking_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_attach staff read"   ON public.booking_attachments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "booking_attach staff insert" ON public.booking_attachments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "booking_attach staff update" ON public.booking_attachments FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "booking_attach admin delete" ON public.booking_attachments FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_booking_attach_booking ON public.booking_attachments(booking_id);

-- booking_reminders
CREATE TABLE IF NOT EXISTS public.booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','snoozed','cancelled')),
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_reminders TO authenticated;
GRANT ALL ON public.booking_reminders TO service_role;
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_rem staff read"   ON public.booking_reminders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "booking_rem staff insert" ON public.booking_reminders FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "booking_rem staff update" ON public.booking_reminders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "booking_rem admin delete" ON public.booking_reminders FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_booking_rem_pending ON public.booking_reminders(remind_at) WHERE status='pending';
CREATE TRIGGER booking_rem_updated BEFORE UPDATE ON public.booking_reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- whatsapp_messages history
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contact_submissions(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  template_code TEXT,
  body TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_msg staff read"   ON public.whatsapp_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "wa_msg staff insert" ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "wa_msg admin delete" ON public.whatsapp_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_wa_msg_booking  ON public.whatsapp_messages(booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_msg_customer ON public.whatsapp_messages(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_msg_contact  ON public.whatsapp_messages(contact_id, created_at DESC);
