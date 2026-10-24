-- Move the public company profile to the new domain.
UPDATE public.settings
SET value = value || jsonb_build_object(
  'website', 'https://taxi-omra.com',
  'email', 'admin@taxi-omra.com'
)
WHERE key = 'company';
