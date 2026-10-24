
-- 1. contact_submissions: replace WITH CHECK (true) with field constraints
DROP POLICY IF EXISTS "contact_submissions public insert" ON public.contact_submissions;
CREATE POLICY "contact_submissions public insert" ON public.contact_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(coalesce(name,'')) between 1 and 200
    AND char_length(coalesce(message,'')) between 1 and 5000
    AND char_length(coalesce(email,'')) <= 320
    AND char_length(coalesce(phone,'')) <= 40
  );

-- 2. error_logs: tighten insert policy
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
CREATE POLICY "Anyone can insert error logs" ON public.error_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(coalesce(message,'')) between 1 and 4000
    AND char_length(coalesce(stack,'')) <= 20000
    AND char_length(coalesce(source,'')) <= 200
  );

-- 3. rate_limit_events: add explicit staff-only policies
CREATE POLICY "rate_limit_events staff select" ON public.rate_limit_events
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "rate_limit_events service insert" ON public.rate_limit_events
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- 4. role_permissions: restrict SELECT to admins only
DROP POLICY IF EXISTS "role_permissions staff read" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions read" ON public.role_permissions;
DROP POLICY IF EXISTS "Staff can read role_permissions" ON public.role_permissions;
CREATE POLICY "role_permissions admin read" ON public.role_permissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
