
-- ============ ENUMS ============
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'online';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'corporate_account';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'invoice_later';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'partially_paid';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'cancelled';

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'fuel','maintenance','insurance','vehicle_repair','driver_salary',
    'marketing','office','software','taxes','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft','issued','paid','partially_paid','overdue','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE refund_type AS ENUM ('full','partial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payroll_status AS ENUM ('draft','approved','paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ Finance permission helper ============
CREATE OR REPLACE FUNCTION public.is_finance(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id
    AND role IN ('admin','manager','accountant'))
$$;

-- ============ Corporate accounts ============
CREATE TABLE IF NOT EXISTS public.corporate_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('CORP-' || upper(substr(gen_random_uuid()::text,1,6))),
  company_name text NOT NULL,
  contact_person text,
  contact_email text,
  contact_phone text,
  billing_address text,
  vat_number text,
  credit_limit numeric(12,2) NOT NULL DEFAULT 0,
  outstanding_balance numeric(12,2) NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_accounts TO authenticated;
GRANT ALL ON public.corporate_accounts TO service_role;
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corp_read" ON public.corporate_accounts FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "corp_write" ON public.corporate_accounts FOR INSERT TO authenticated WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "corp_update" ON public.corporate_accounts FOR UPDATE TO authenticated USING (is_finance(auth.uid())) WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "corp_delete" ON public.corporate_accounts FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_corp_updated BEFORE UPDATE ON public.corporate_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS corporate_account_id uuid REFERENCES public.corporate_accounts(id) ON DELETE SET NULL;

-- ============ Payments extension ============
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS vat_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.gen_payment_number() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.payment_number IS NULL THEN
    NEW.payment_number := 'PAY-' || to_char(now(),'YYYYMM') || '-' || upper(substr(gen_random_uuid()::text,1,6));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_payments_number ON public.payments;
CREATE TRIGGER trg_payments_number BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.gen_payment_number();
DROP TRIGGER IF EXISTS trg_payments_updated ON public.payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at);

-- ============ Invoices ============
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  corporate_account_id uuid REFERENCES public.corporate_accounts(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  currency text NOT NULL DEFAULT 'SAR',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  vat_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  pdf_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_read" ON public.invoices FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "inv_write" ON public.invoices FOR INSERT TO authenticated WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "inv_update" ON public.invoices FOR UPDATE TO authenticated USING (is_finance(auth.uid())) WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "inv_delete" ON public.invoices FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.gen_invoice_number() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || to_char(now(),'YYYYMM') || '-' || upper(substr(gen_random_uuid()::text,1,6));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_invoices_number ON public.invoices;
CREATE TRIGGER trg_invoices_number BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.gen_invoice_number();
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_corp ON public.invoices(corporate_account_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue ON public.invoices(issue_date);

-- ============ Expenses ============
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('EXP-' || to_char(now(),'YYYYMM') || '-' || upper(substr(gen_random_uuid()::text,1,6))),
  category expense_category NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'SAR',
  vat_amount numeric(12,2) NOT NULL DEFAULT 0,
  supplier text,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  receipt_url text,
  expense_date date NOT NULL DEFAULT current_date,
  notes text,
  approved_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exp_read" ON public.expenses FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "exp_write" ON public.expenses FOR INSERT TO authenticated WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "exp_update" ON public.expenses FOR UPDATE TO authenticated USING (is_finance(auth.uid())) WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "exp_delete" ON public.expenses FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON public.expenses(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expenses_driver ON public.expenses(driver_id);

-- ============ Refunds ============
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('REF-' || to_char(now(),'YYYYMM') || '-' || upper(substr(gen_random_uuid()::text,1,6))),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  refund_type refund_type NOT NULL DEFAULT 'full',
  reason text,
  method payment_method NOT NULL DEFAULT 'cash',
  refund_date timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref_read" ON public.refunds FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "ref_write" ON public.refunds FOR INSERT TO authenticated WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "ref_update" ON public.refunds FOR UPDATE TO authenticated USING (is_finance(auth.uid())) WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "ref_delete" ON public.refunds FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_date ON public.refunds(refund_date);

-- Auto-update payment when refund inserted
CREATE OR REPLACE FUNCTION public.trg_refund_apply() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_paid numeric(12,2); v_total numeric(12,2);
BEGIN
  SELECT paid_amount, amount INTO v_paid, v_total FROM public.payments WHERE id = NEW.payment_id;
  UPDATE public.payments
    SET paid_amount = GREATEST(0, v_paid - NEW.amount),
        status = CASE
          WHEN NEW.refund_type='full' OR NEW.amount >= v_total THEN 'refunded'::payment_status
          ELSE 'partially_paid'::payment_status END,
        updated_at = now()
    WHERE id = NEW.payment_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_refunds_apply ON public.refunds;
CREATE TRIGGER trg_refunds_apply AFTER INSERT ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.trg_refund_apply();

-- ============ Driver payroll ============
CREATE TABLE IF NOT EXISTS public.driver_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  trip_count int NOT NULL DEFAULT 0,
  gross_revenue numeric(12,2) NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 0,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  bonuses numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_salary numeric(12,2) NOT NULL DEFAULT 0,
  status payroll_status NOT NULL DEFAULT 'draft',
  paid_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (driver_id, period_start, period_end)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_payroll TO authenticated;
GRANT ALL ON public.driver_payroll TO service_role;
ALTER TABLE public.driver_payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay_read" ON public.driver_payroll FOR SELECT TO authenticated USING (is_finance(auth.uid()));
CREATE POLICY "pay_write" ON public.driver_payroll FOR INSERT TO authenticated WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "pay_update" ON public.driver_payroll FOR UPDATE TO authenticated USING (is_finance(auth.uid())) WITH CHECK (is_finance(auth.uid()));
CREATE POLICY "pay_delete" ON public.driver_payroll FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_payroll_updated BEFORE UPDATE ON public.driver_payroll FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ Finance settings (single row) ============
CREATE TABLE IF NOT EXISTS public.finance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Taxi Co.',
  company_address text,
  company_phone text,
  company_email text,
  vat_number text,
  vat_rate numeric(5,2) NOT NULL DEFAULT 15.00,
  currency text NOT NULL DEFAULT 'SAR',
  invoice_footer text,
  default_commission_rate numeric(5,2) NOT NULL DEFAULT 20.00,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.finance_settings TO authenticated;
GRANT ALL ON public.finance_settings TO service_role;
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fs_read" ON public.finance_settings FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "fs_admin_all" ON public.finance_settings FOR ALL TO authenticated USING (is_finance(auth.uid())) WITH CHECK (is_finance(auth.uid()));
GRANT INSERT, UPDATE ON public.finance_settings TO authenticated;
INSERT INTO public.finance_settings (company_name) SELECT 'Taxi Co.' WHERE NOT EXISTS (SELECT 1 FROM public.finance_settings);

-- ============ Auto-create invoice on booking completed ============
CREATE OR REPLACE FUNCTION public.trg_booking_autoinvoice() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_rate numeric; v_vat numeric; v_subtotal numeric; v_corp uuid;
BEGIN
  IF NEW.status='completed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF EXISTS (SELECT 1 FROM public.invoices WHERE booking_id=NEW.id) THEN RETURN NEW; END IF;
    SELECT vat_rate INTO v_rate FROM public.finance_settings LIMIT 1;
    v_rate := COALESCE(v_rate, 15.0);
    v_subtotal := COALESCE(NEW.total_fare,0) - COALESCE(NEW.discount,0);
    v_vat := round(v_subtotal * v_rate/100.0, 2);
    SELECT corporate_account_id INTO v_corp FROM public.customers WHERE id=NEW.customer_id;
    INSERT INTO public.invoices (booking_id, customer_id, corporate_account_id, subtotal, vat_amount, discount_amount, total_amount, status, due_date)
    VALUES (NEW.id, NEW.customer_id, v_corp, v_subtotal, v_vat, COALESCE(NEW.discount,0),
            v_subtotal + v_vat,
            CASE WHEN v_corp IS NOT NULL THEN 'issued'::invoice_status ELSE 'issued'::invoice_status END,
            current_date + INTERVAL '30 days');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_bookings_autoinvoice ON public.bookings;
CREATE TRIGGER trg_bookings_autoinvoice AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.trg_booking_autoinvoice();
