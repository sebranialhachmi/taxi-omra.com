
-- Extend permissions with module + action columns for enterprise RBAC
ALTER TABLE public.permissions
  ADD COLUMN IF NOT EXISTS module text,
  ADD COLUMN IF NOT EXISTS action text;

-- Backfill module/action from existing code (module.action pattern)
UPDATE public.permissions SET
  module = COALESCE(module, split_part(code, '.', 1)),
  action = COALESCE(action, split_part(code, '.', 2))
WHERE module IS NULL OR action IS NULL;

-- Seed complete permission catalog: modules x actions
DO $$
DECLARE
  m text;
  a text;
  modules text[] := ARRAY[
    'bookings','customers','drivers','fleet','categories','routes','dispatch','calendar','tasks','reminders',
    'finance','payments','invoices','expenses','refunds','corporate','payroll','pricing','coupons',
    'cms','blog','pages','faqs','testimonials','team','menus','hero','homepage','media','promotions','partners','services','cities','airports',
    'seo','redirects','contacts','whatsapp',
    'reports','analytics','audit','activity',
    'users','roles','settings','operations','notifications','marketing'
  ];
  actions text[] := ARRAY['view','create','edit','delete','export','publish','assign','manage','approve','print','restore','audit'];
BEGIN
  FOREACH m IN ARRAY modules LOOP
    FOREACH a IN ARRAY actions LOOP
      INSERT INTO public.permissions (code, module, action, description)
      VALUES (m || '.' || a, m, a, initcap(a) || ' ' || m)
      ON CONFLICT (code) DO UPDATE SET module = EXCLUDED.module, action = EXCLUDED.action;
    END LOOP;
  END LOOP;
  -- System-wide meta permissions
  INSERT INTO public.permissions (code, module, action, description) VALUES
    ('system.manage','system','manage','Full system administration'),
    ('system.audit','system','audit','Access audit trail')
  ON CONFLICT (code) DO NOTHING;
END $$;

CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);

-- Auto-grant every permission to admin role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
ON CONFLICT DO NOTHING;

-- Baseline grants: manager gets everything except system.*
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM public.permissions WHERE module <> 'system'
ON CONFLICT DO NOTHING;

-- Dispatcher: operations modules view/edit/assign
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'dispatcher'::app_role, id FROM public.permissions
WHERE module IN ('bookings','customers','drivers','fleet','dispatch','calendar','tasks','reminders','routes','categories','contacts','whatsapp','notifications')
  AND action IN ('view','create','edit','assign','print','export')
ON CONFLICT DO NOTHING;

-- Accountant: finance modules + read others
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'accountant'::app_role, id FROM public.permissions
WHERE (module IN ('finance','payments','invoices','expenses','refunds','corporate','payroll','pricing','coupons','reports','analytics') AND action IN ('view','create','edit','export','print','approve','manage'))
   OR (module IN ('bookings','customers','drivers','fleet') AND action IN ('view','export'))
ON CONFLICT DO NOTHING;

-- Core has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND (p.code = _code OR p.code = split_part(_code,'.',1) || '.manage')
  ) OR public.has_role(_user_id, 'admin'::app_role);
$$;

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, anon, service_role;

-- Fetch effective permissions list for a user
CREATE OR REPLACE FUNCTION public.user_permissions(_user_id uuid)
RETURNS TABLE(code text, module text, action text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.code, p.module, p.action
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role = ur.role
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = _user_id
$$;

GRANT EXECUTE ON FUNCTION public.user_permissions(uuid) TO authenticated, service_role;

-- Trigger to keep admin role fully privileged when new permissions land
CREATE OR REPLACE FUNCTION public.trg_new_permission_grants_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.role_permissions (role, permission_id)
  VALUES ('admin'::app_role, NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_permission_admin_grant ON public.permissions;
CREATE TRIGGER trg_permission_admin_grant
AFTER INSERT ON public.permissions
FOR EACH ROW EXECUTE FUNCTION public.trg_new_permission_grants_admin();
