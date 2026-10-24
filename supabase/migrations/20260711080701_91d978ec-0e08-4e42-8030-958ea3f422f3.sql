
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','manager','dispatcher','accountant','driver');
CREATE TYPE public.booking_status AS ENUM ('pending','assigned','en_route','on_trip','completed','cancelled','no_show');
CREATE TYPE public.driver_status AS ENUM ('offline','available','on_trip','on_break','suspended');
CREATE TYPE public.vehicle_status AS ENUM ('active','maintenance','retired');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE public.payment_method AS ENUM ('cash','card','wallet','bank_transfer');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('admin','manager','dispatcher','accountant'))
$$;

-- ============ PERMISSIONS ============
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.role_permissions (
  role public.app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ============ VEHICLE CATEGORIES ============
CREATE TABLE public.vehicle_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  base_fare numeric(10,2) NOT NULL DEFAULT 0,
  price_per_km numeric(10,2) NOT NULL DEFAULT 0,
  price_per_min numeric(10,2) NOT NULL DEFAULT 0,
  seats int NOT NULL DEFAULT 4,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_categories TO authenticated;
GRANT ALL ON public.vehicle_categories TO service_role;
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vehicle_category_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.vehicle_categories(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  description text,
  UNIQUE (category_id, locale)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_category_translations TO authenticated;
GRANT ALL ON public.vehicle_category_translations TO service_role;
ALTER TABLE public.vehicle_category_translations ENABLE ROW LEVEL SECURITY;

-- ============ VEHICLES ============
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number text UNIQUE NOT NULL,
  make text,
  model text,
  year int,
  color text,
  seats int NOT NULL DEFAULT 4,
  category_id uuid REFERENCES public.vehicle_categories(id),
  status public.vehicle_status NOT NULL DEFAULT 'active',
  last_maintenance_date date,
  next_maintenance_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- ============ DRIVERS ============
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  license_number text UNIQUE,
  license_expiry date,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status public.driver_status NOT NULL DEFAULT 'offline',
  rating numeric(3,2) DEFAULT 5.0,
  total_trips int NOT NULL DEFAULT 0,
  total_earnings numeric(12,2) NOT NULL DEFAULT 0,
  hired_at date DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text UNIQUE,
  email text,
  total_trips int NOT NULL DEFAULT 0,
  total_spent numeric(12,2) NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ============ ROUTES ============
CREATE TABLE public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  distance_km numeric(8,2),
  duration_min int,
  fixed_price numeric(10,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routes TO authenticated;
GRANT ALL ON public.routes TO service_role;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- ============ PRICING RULES ============
CREATE TABLE public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.vehicle_categories(id) ON DELETE CASCADE,
  waiting_per_min numeric(10,2) NOT NULL DEFAULT 0,
  night_surcharge_pct numeric(5,2) NOT NULL DEFAULT 0,
  night_start_hour int NOT NULL DEFAULT 22,
  night_end_hour int NOT NULL DEFAULT 6,
  airport_fee numeric(10,2) NOT NULL DEFAULT 0,
  min_fare numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_rules TO authenticated;
GRANT ALL ON public.pricing_rules TO service_role;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- ============ COUPONS ============
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','amount')),
  discount_value numeric(10,2) NOT NULL,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ============ BOOKINGS ============
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL DEFAULT ('BK-' || upper(substr(gen_random_uuid()::text,1,8))),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  driver_id uuid REFERENCES public.drivers(id),
  vehicle_id uuid REFERENCES public.vehicles(id),
  category_id uuid REFERENCES public.vehicle_categories(id),
  route_id uuid REFERENCES public.routes(id),
  coupon_id uuid REFERENCES public.coupons(id),
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  pickup_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  distance_km numeric(8,2),
  duration_min int,
  waiting_min int NOT NULL DEFAULT 0,
  base_fare numeric(10,2) NOT NULL DEFAULT 0,
  distance_fare numeric(10,2) NOT NULL DEFAULT 0,
  time_fare numeric(10,2) NOT NULL DEFAULT 0,
  waiting_fare numeric(10,2) NOT NULL DEFAULT 0,
  night_surcharge numeric(10,2) NOT NULL DEFAULT 0,
  airport_fee numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total_fare numeric(10,2) NOT NULL DEFAULT 0,
  status public.booking_status NOT NULL DEFAULT 'pending',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_driver ON public.bookings(driver_id);
CREATE INDEX idx_bookings_pickup_at ON public.bookings(pickup_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method public.payment_method NOT NULL DEFAULT 'cash',
  status public.payment_status NOT NULL DEFAULT 'pending',
  transaction_ref text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_booking ON public.payments(booking_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============ POLICIES ============
-- profiles: user can read/update own; staff sees all
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles admin insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

-- user_roles: only admins manage; users read own
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "roles admin write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- permissions & role_permissions: staff read, admin write
CREATE POLICY "perms staff read" ON public.permissions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "perms admin write" ON public.permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "rp staff read" ON public.role_permissions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "rp admin write" ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Helper: staff read/write on generic tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'vehicle_categories','vehicle_category_translations','vehicles','drivers',
    'customers','routes','pricing_rules','coupons','bookings','payments','settings'
  ]) LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff(auth.uid()))', t||'_staff_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))', t||'_staff_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t||'_staff_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''manager''))', t||'_admin_delete', t);
  END LOOP;
END$$;

-- notifications: user reads own
CREATE POLICY "notif self read" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "notif self update" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "notif staff insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

-- audit_logs: staff read, anyone authenticated can insert (server-side)
CREATE POLICY "audit staff read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "audit insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER vehicles_updated BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER drivers_updated BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED DATA ============
INSERT INTO public.vehicle_categories (code, base_fare, price_per_km, price_per_min, seats, sort_order) VALUES
  ('economy', 5, 2, 0.3, 4, 1),
  ('standard', 8, 2.5, 0.4, 4, 2),
  ('business', 15, 4, 0.6, 4, 3),
  ('suv', 12, 3.5, 0.5, 6, 4),
  ('van', 18, 4.5, 0.6, 8, 5),
  ('premium', 25, 6, 0.8, 4, 6);

INSERT INTO public.vehicle_category_translations (category_id, locale, name, description)
SELECT id, 'en', initcap(code), 'Category ' || code FROM public.vehicle_categories;

INSERT INTO public.vehicle_category_translations (category_id, locale, name, description)
SELECT id, 'ar',
  CASE code
    WHEN 'economy' THEN 'اقتصادي' WHEN 'standard' THEN 'عادي' WHEN 'business' THEN 'أعمال'
    WHEN 'suv' THEN 'دفع رباعي' WHEN 'van' THEN 'فان' WHEN 'premium' THEN 'بريميوم' END,
  'فئة ' || code FROM public.vehicle_categories;

INSERT INTO public.pricing_rules (category_id, waiting_per_min, night_surcharge_pct, airport_fee, min_fare)
SELECT id, 0.5, 20, 10, 10 FROM public.vehicle_categories;

INSERT INTO public.settings (key, value, description) VALUES
  ('company', '{"name":"سُرعة تاكسي","currency":"USD","timezone":"UTC","phone":"+000000000"}'::jsonb, 'Company info'),
  ('features', '{"night_rate":true,"airport_fee":true,"coupons":true}'::jsonb, 'Feature flags');

INSERT INTO public.permissions (code, description) VALUES
  ('bookings.read','View bookings'),('bookings.write','Create/update bookings'),('bookings.delete','Delete bookings'),
  ('drivers.manage','Manage drivers'),('fleet.manage','Manage fleet'),('customers.manage','Manage customers'),
  ('pricing.manage','Manage pricing'),('coupons.manage','Manage coupons'),('payments.manage','Manage payments'),
  ('reports.view','View reports'),('users.manage','Manage users'),('settings.manage','Manage settings'),
  ('audit.view','View audit logs');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::public.app_role, id FROM public.permissions;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::public.app_role, id FROM public.permissions
WHERE code NOT IN ('users.manage','settings.manage');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'dispatcher'::public.app_role, id FROM public.permissions
WHERE code IN ('bookings.read','bookings.write','drivers.manage','customers.manage');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'accountant'::public.app_role, id FROM public.permissions
WHERE code IN ('bookings.read','payments.manage','reports.view');
