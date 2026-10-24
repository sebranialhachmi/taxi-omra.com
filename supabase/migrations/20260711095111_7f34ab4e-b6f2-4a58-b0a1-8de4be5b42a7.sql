
-- 1. Extend enums
ALTER TYPE driver_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE driver_status ADD VALUE IF NOT EXISTS 'en_route';
ALTER TYPE driver_status ADD VALUE IF NOT EXISTS 'waiting';
ALTER TYPE driver_status ADD VALUE IF NOT EXISTS 'vacation';

ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'available';
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'on_trip';
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'out_of_service';
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'reserved';

-- 2. Driver enums for employment / document / maintenance
DO $$ BEGIN
  CREATE TYPE employment_status AS ENUM ('active','probation','suspended','terminated','vacation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE driver_doc_kind AS ENUM ('license','national_id','medical','work_permit','insurance','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_doc_kind AS ENUM ('registration','insurance','inspection','taxi_permit','road_tax','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_kind AS ENUM ('oil_change','tire','brake','battery','inspection','general','repair','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Extend drivers table
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS license_class text,
  ADD COLUMN IF NOT EXISTS medical_expiry date,
  ADD COLUMN IF NOT EXISTS work_permit_expiry date,
  ADD COLUMN IF NOT EXISTS insurance_expiry date,
  ADD COLUMN IF NOT EXISTS employment_status employment_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completed_trips int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_trips int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_show_trips int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2);

-- 4. Extend vehicles table
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS internal_code text,
  ADD COLUMN IF NOT EXISTS vin text,
  ADD COLUMN IF NOT EXISTS luggage_capacity int NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS fuel_type text,
  ADD COLUMN IF NOT EXISTS transmission text,
  ADD COLUMN IF NOT EXISTS current_mileage int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_maintenance_mileage int,
  ADD COLUMN IF NOT EXISTS registration_expiry date,
  ADD COLUMN IF NOT EXISTS insurance_expiry date,
  ADD COLUMN IF NOT EXISTS inspection_expiry date,
  ADD COLUMN IF NOT EXISTS taxi_permit_expiry date,
  ADD COLUMN IF NOT EXISTS road_tax_expiry date;

-- 5. driver_documents
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  kind driver_doc_kind NOT NULL,
  title text,
  file_path text,
  document_number text,
  issued_on date,
  expires_on date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_documents TO authenticated;
GRANT ALL ON public.driver_documents TO service_role;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read driver docs" ON public.driver_documents FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write driver docs" ON public.driver_documents FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update driver docs" ON public.driver_documents FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete driver docs" ON public.driver_documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE INDEX IF NOT EXISTS idx_driver_docs_driver ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_docs_expiry ON public.driver_documents(expires_on);

-- 6. vehicle_documents
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  kind vehicle_doc_kind NOT NULL,
  title text,
  file_path text,
  document_number text,
  issued_on date,
  expires_on date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_documents TO authenticated;
GRANT ALL ON public.vehicle_documents TO service_role;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read vehicle docs" ON public.vehicle_documents FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write vehicle docs" ON public.vehicle_documents FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update vehicle docs" ON public.vehicle_documents FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete vehicle docs" ON public.vehicle_documents FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE INDEX IF NOT EXISTS idx_vehicle_docs_vehicle ON public.vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_docs_expiry ON public.vehicle_documents(expires_on);

-- 7. vehicle_maintenance
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  kind maintenance_kind NOT NULL,
  description text,
  service_date date NOT NULL DEFAULT current_date,
  mileage int,
  cost numeric(12,2) NOT NULL DEFAULT 0,
  vendor text,
  next_due_date date,
  next_due_mileage int,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_maintenance TO authenticated;
GRANT ALL ON public.vehicle_maintenance TO service_role;
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read maint" ON public.vehicle_maintenance FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert maint" ON public.vehicle_maintenance FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update maint" ON public.vehicle_maintenance FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete maint" ON public.vehicle_maintenance FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE INDEX IF NOT EXISTS idx_maint_vehicle ON public.vehicle_maintenance(vehicle_id, service_date DESC);

-- 8. driver_vehicle_assignments (assignment history)
CREATE TABLE IF NOT EXISTS public.driver_vehicle_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  assigned_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_vehicle_assignments TO authenticated;
GRANT ALL ON public.driver_vehicle_assignments TO service_role;
ALTER TABLE public.driver_vehicle_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read dva" ON public.driver_vehicle_assignments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert dva" ON public.driver_vehicle_assignments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update dva" ON public.driver_vehicle_assignments FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete dva" ON public.driver_vehicle_assignments FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_dva_driver ON public.driver_vehicle_assignments(driver_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_dva_vehicle ON public.driver_vehicle_assignments(vehicle_id, started_at DESC);

-- 9. updated_at triggers
DROP TRIGGER IF EXISTS trg_driver_docs_upd ON public.driver_documents;
CREATE TRIGGER trg_driver_docs_upd BEFORE UPDATE ON public.driver_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_vehicle_docs_upd ON public.vehicle_documents;
CREATE TRIGGER trg_vehicle_docs_upd BEFORE UPDATE ON public.vehicle_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_maint_upd ON public.vehicle_maintenance;
CREATE TRIGGER trg_maint_upd BEFORE UPDATE ON public.vehicle_maintenance FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Driver stats recompute
CREATE OR REPLACE FUNCTION public.recompute_driver_stats(_driver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int; v_completed int; v_cancelled int; v_no_show int; v_revenue numeric(12,2);
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE status='completed'),
    count(*) FILTER (WHERE status='cancelled'),
    count(*) FILTER (WHERE status='no_show'),
    coalesce(sum(total_fare) FILTER (WHERE status='completed'),0)
  INTO v_total, v_completed, v_cancelled, v_no_show, v_revenue
  FROM public.bookings WHERE driver_id = _driver_id;

  UPDATE public.drivers SET
    total_trips = v_total,
    completed_trips = v_completed,
    cancelled_trips = v_cancelled,
    no_show_trips = v_no_show,
    total_earnings = v_revenue,
    updated_at = now()
  WHERE id = _driver_id;
END $$;

CREATE OR REPLACE FUNCTION public.trg_bookings_recompute_driver()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP='DELETE' THEN
    IF OLD.driver_id IS NOT NULL THEN PERFORM public.recompute_driver_stats(OLD.driver_id); END IF;
    RETURN OLD;
  END IF;
  IF NEW.driver_id IS NOT NULL THEN PERFORM public.recompute_driver_stats(NEW.driver_id); END IF;
  IF TG_OP='UPDATE' AND NEW.driver_id IS DISTINCT FROM OLD.driver_id AND OLD.driver_id IS NOT NULL THEN
    PERFORM public.recompute_driver_stats(OLD.driver_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bookings_driver_stats ON public.bookings;
CREATE TRIGGER trg_bookings_driver_stats
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.trg_bookings_recompute_driver();

REVOKE ALL ON FUNCTION public.recompute_driver_stats(uuid) FROM PUBLIC, anon, authenticated;
