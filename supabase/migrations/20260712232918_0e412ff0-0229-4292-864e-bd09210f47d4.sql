UPDATE public.settings
SET value = jsonb_build_object(
  'name', 'Omra Taxi',
  'name_ar', 'عمرة تاكسي',
  'legal_name', 'Omra Taxi',
  'website', 'https://omrataxi-sa.online',
  'email', 'admin@omrataxi-sa.online',
  'phone', '+966551796487',
  'whatsapp', '+966551796487',
  'address_en', 'Jeddah, Saudi Arabia',
  'address_ar', 'جدة، المملكة العربية السعودية',
  'city', 'Jeddah',
  'country', 'SA',
  'currency', 'SAR',
  'timezone', 'Asia/Riyadh',
  'hours', '24/7'
)
WHERE key = 'company';

UPDATE public.finance_settings
SET company_name = 'Omra Taxi'
WHERE company_name IN ('Jeddah Travels', 'Taxi Co.');