ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS default_delivery_price numeric(12,2);
DELETE FROM public.error_logs WHERE resolved = true OR created_at < now() - interval '7 days';