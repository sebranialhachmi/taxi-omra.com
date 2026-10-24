
-- 1) Normalize + merge duplicates by phone before enforcing uniqueness
WITH dupes AS (
  SELECT lower(btrim(phone)) AS phone_key,
         (array_agg(id ORDER BY created_at))[1] AS keep_id,
         array_agg(id ORDER BY created_at) AS all_ids
  FROM public.customers
  WHERE phone IS NOT NULL AND btrim(phone) <> ''
  GROUP BY lower(btrim(phone))
  HAVING count(*) > 1
)
UPDATE public.bookings b
SET customer_id = d.keep_id
FROM dupes d
WHERE b.customer_id = ANY(d.all_ids) AND b.customer_id <> d.keep_id;

WITH dupes AS (
  SELECT lower(btrim(phone)) AS phone_key,
         (array_agg(id ORDER BY created_at))[1] AS keep_id,
         array_agg(id ORDER BY created_at) AS all_ids
  FROM public.customers
  WHERE phone IS NOT NULL AND btrim(phone) <> ''
  GROUP BY lower(btrim(phone))
  HAVING count(*) > 1
)
DELETE FROM public.customers c
USING dupes d
WHERE c.id = ANY(d.all_ids) AND c.id <> d.keep_id;

-- 2) Case-insensitive partial unique index on phone (skips NULL / blank)
CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_unique_ci
  ON public.customers (lower(btrim(phone)))
  WHERE phone IS NOT NULL AND btrim(phone) <> '';
