
CREATE OR REPLACE FUNCTION public.gen_payment_number() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.payment_number IS NULL THEN
    NEW.payment_number := 'PAY-' || to_char(now(),'YYYYMM') || '-' || upper(substr(gen_random_uuid()::text,1,6));
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.gen_invoice_number() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || to_char(now(),'YYYYMM') || '-' || upper(substr(gen_random_uuid()::text,1,6));
  END IF;
  RETURN NEW;
END $$;
