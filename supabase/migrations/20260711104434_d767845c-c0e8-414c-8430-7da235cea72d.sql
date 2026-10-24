
-- Phase 8: Production hardening — error logging, system health polling.

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'error',       -- debug | info | warn | error | fatal
  source TEXT NOT NULL DEFAULT 'client',     -- client | server | edge | cron
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS error_logs_created_idx ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_level_idx ON public.error_logs(level);
CREATE INDEX IF NOT EXISTS error_logs_resolved_idx ON public.error_logs(resolved) WHERE resolved = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO authenticated;
GRANT INSERT ON public.error_logs TO anon;    -- allow client-side crash reports before auth
GRANT ALL ON public.error_logs TO service_role;

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can read error logs"
  ON public.error_logs FOR SELECT
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Managers can update error logs"
  ON public.error_logs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete error logs"
  ON public.error_logs FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Rate-limit table for public endpoints (contact form etc.)
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,             -- e.g. "contact:<ip>" or "contact:<email>"
  bucket TIMESTAMPTZ NOT NULL,   -- 1-minute window start
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key, bucket)
);

CREATE INDEX IF NOT EXISTS rate_limit_bucket_idx ON public.rate_limit_events(bucket);

GRANT ALL ON public.rate_limit_events TO service_role;
-- No app-role grants: only the service role writes/reads via privileged fns.

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
-- No policies: locked down; service role bypasses RLS.

-- Snapshot table for operations dashboard time-series
CREATE TABLE IF NOT EXISTS public.ops_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.ops_snapshots TO authenticated;
GRANT ALL ON public.ops_snapshots TO service_role;

ALTER TABLE public.ops_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read snapshots"
  ON public.ops_snapshots FOR SELECT
  USING (public.is_staff(auth.uid()));
