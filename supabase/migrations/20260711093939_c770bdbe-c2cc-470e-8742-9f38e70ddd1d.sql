
-- Enum for customer tier
DO $$ BEGIN
  CREATE TYPE public.customer_tier AS ENUM ('regular','vip','corporate','blacklisted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.customer_note_kind AS ENUM ('note','call','whatsapp','complaint','compliment','follow_up');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS alt_phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS tier public.customer_tier NOT NULL DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completed_trips integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_trips integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_show_trips integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_booking_value numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_booking_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_booking_at timestamptz,
  ADD COLUMN IF NOT EXISTS favorite_pickup text,
  ADD COLUMN IF NOT EXISTS favorite_dropoff text,
  ADD COLUMN IF NOT EXISTS favorite_category_id uuid REFERENCES public.vehicle_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS favorite_driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preferred_payment_method text,
  ADD COLUMN IF NOT EXISTS preferred_pickup_hour smallint;

CREATE INDEX IF NOT EXISTS idx_customers_tier ON public.customers(tier);
CREATE INDEX IF NOT EXISTS idx_customers_tags ON public.customers USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_customers_last_booking ON public.customers(last_booking_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers USING gin (
  to_tsvector('simple', coalesce(full_name,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(whatsapp,'') || ' ' || coalesce(email,'') || ' ' || coalesce(company,''))
);

-- Customer notes / timeline
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  kind public.customer_note_kind NOT NULL DEFAULT 'note',
  body text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_notes_staff_read" ON public.customer_notes FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "customer_notes_staff_insert" ON public.customer_notes FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "customer_notes_staff_update" ON public.customer_notes FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "customer_notes_admin_delete" ON public.customer_notes FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON public.customer_notes(customer_id, created_at DESC);

-- Customer documents
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  doc_type text NOT NULL, -- passport | national_id | driving_license | other
  label text,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  expires_at date,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_documents TO authenticated;
GRANT ALL ON public.customer_documents TO service_role;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_documents_staff_read" ON public.customer_documents FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "customer_documents_staff_insert" ON public.customer_documents FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "customer_documents_staff_update" ON public.customer_documents FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "customer_documents_admin_delete" ON public.customer_documents FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));

CREATE INDEX IF NOT EXISTS idx_customer_documents_customer ON public.customer_documents(customer_id, created_at DESC);

-- Recompute customer stats function
CREATE OR REPLACE FUNCTION public.recompute_customer_stats(_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int; v_completed int; v_cancelled int; v_no_show int;
  v_revenue numeric(12,2); v_avg numeric(12,2);
  v_first timestamptz; v_last timestamptz;
  v_fav_pickup text; v_fav_dropoff text; v_fav_cat uuid; v_fav_driver uuid;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE status='completed'),
    count(*) FILTER (WHERE status='cancelled'),
    count(*) FILTER (WHERE status='no_show'),
    coalesce(sum(total_fare) FILTER (WHERE status='completed'),0),
    coalesce(avg(total_fare) FILTER (WHERE status='completed'),0),
    min(pickup_at),
    max(pickup_at)
  INTO v_total, v_completed, v_cancelled, v_no_show, v_revenue, v_avg, v_first, v_last
  FROM public.bookings WHERE customer_id = _customer_id;

  SELECT pickup_location  INTO v_fav_pickup  FROM public.bookings WHERE customer_id=_customer_id GROUP BY pickup_location  ORDER BY count(*) DESC NULLS LAST LIMIT 1;
  SELECT dropoff_location INTO v_fav_dropoff FROM public.bookings WHERE customer_id=_customer_id GROUP BY dropoff_location ORDER BY count(*) DESC NULLS LAST LIMIT 1;
  SELECT category_id INTO v_fav_cat    FROM public.bookings WHERE customer_id=_customer_id AND category_id IS NOT NULL GROUP BY category_id ORDER BY count(*) DESC LIMIT 1;
  SELECT driver_id   INTO v_fav_driver FROM public.bookings WHERE customer_id=_customer_id AND driver_id   IS NOT NULL GROUP BY driver_id   ORDER BY count(*) DESC LIMIT 1;

  UPDATE public.customers SET
    total_trips = v_total,
    completed_trips = v_completed,
    cancelled_trips = v_cancelled,
    no_show_trips = v_no_show,
    total_spent = v_revenue,
    avg_booking_value = v_avg,
    first_booking_at = v_first,
    last_booking_at = v_last,
    favorite_pickup = v_fav_pickup,
    favorite_dropoff = v_fav_dropoff,
    favorite_category_id = v_fav_cat,
    favorite_driver_id = v_fav_driver,
    updated_at = now()
  WHERE id = _customer_id;
END $$;

CREATE OR REPLACE FUNCTION public.trg_bookings_recompute_customer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='DELETE' THEN PERFORM public.recompute_customer_stats(OLD.customer_id); RETURN OLD; END IF;
  PERFORM public.recompute_customer_stats(NEW.customer_id);
  IF TG_OP='UPDATE' AND NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
    PERFORM public.recompute_customer_stats(OLD.customer_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS bookings_recompute_customer ON public.bookings;
CREATE TRIGGER bookings_recompute_customer
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.trg_bookings_recompute_customer();

-- Backfill existing customers
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.customers LOOP
    PERFORM public.recompute_customer_stats(r.id);
  END LOOP;
END $$;
