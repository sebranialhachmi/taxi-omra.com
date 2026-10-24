
-- Phase 1: Booking Workflow + Activity Timeline

-- Extend booking_status enum with new workflow states
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'confirmed' BEFORE 'assigned';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'picked_up' AFTER 'on_trip';

-- Booking priority flag + cancellation reason
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_priority boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_bookings_status_pickup ON public.bookings(status, pickup_at);
CREATE INDEX IF NOT EXISTS idx_bookings_priority ON public.bookings(is_priority) WHERE is_priority = true;

-- ============================================================
-- Activity timeline (polymorphic across all core entities)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,        -- 'booking' | 'customer' | 'driver' | 'vehicle' | 'task' | ...
  entity_id uuid NOT NULL,
  event_type text NOT NULL,         -- 'created' | 'updated' | 'status_changed' | 'assigned' | 'note_added' | ...
  from_value text,
  to_value text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.activity_events TO authenticated;
GRANT ALL ON public.activity_events TO service_role;

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read activity" ON public.activity_events
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff insert activity" ON public.activity_events
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_events(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_events(created_at DESC);

-- ============================================================
-- Booking status transition trigger → activity log
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_booking_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_events(entity_type, entity_id, event_type, to_value, actor_id, message, metadata)
    VALUES ('booking', NEW.id, 'created', NEW.status::text, v_actor,
            'Booking ' || COALESCE(NEW.code,'') || ' created',
            jsonb_build_object('code', NEW.code, 'pickup', NEW.pickup_location, 'dropoff', NEW.dropoff_location));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      -- Auto-stamp timestamps for key transitions
      IF NEW.status = 'confirmed' AND NEW.confirmed_at IS NULL THEN NEW.confirmed_at := now(); END IF;
      IF NEW.status = 'assigned'  AND NEW.assigned_at  IS NULL THEN NEW.assigned_at  := now(); END IF;
      IF NEW.status = 'on_trip'   AND NEW.started_at   IS NULL THEN NEW.started_at   := now(); END IF;
      IF NEW.status = 'picked_up' AND NEW.started_at   IS NULL THEN NEW.started_at   := now(); END IF;
      IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN NEW.completed_at := now(); END IF;

      INSERT INTO public.activity_events(entity_type, entity_id, event_type, from_value, to_value, actor_id, message)
      VALUES ('booking', NEW.id, 'status_changed', OLD.status::text, NEW.status::text, v_actor,
              'Status: ' || OLD.status::text || ' → ' || NEW.status::text);
    END IF;

    IF NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
      INSERT INTO public.activity_events(entity_type, entity_id, event_type, from_value, to_value, actor_id, message)
      VALUES ('booking', NEW.id, 'driver_assigned',
              COALESCE(OLD.driver_id::text,''), COALESCE(NEW.driver_id::text,''), v_actor,
              CASE WHEN OLD.driver_id IS NULL THEN 'Driver assigned'
                   WHEN NEW.driver_id IS NULL THEN 'Driver unassigned'
                   ELSE 'Driver reassigned' END);
    END IF;

    IF NEW.vehicle_id IS DISTINCT FROM OLD.vehicle_id THEN
      INSERT INTO public.activity_events(entity_type, entity_id, event_type, from_value, to_value, actor_id, message)
      VALUES ('booking', NEW.id, 'vehicle_assigned',
              COALESCE(OLD.vehicle_id::text,''), COALESCE(NEW.vehicle_id::text,''), v_actor, 'Vehicle updated');
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bookings_activity ON public.bookings;
CREATE TRIGGER trg_bookings_activity
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_booking_activity();
