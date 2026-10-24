UPDATE public.settings
SET value = jsonb_build_object(
  'name', 'Jeddah Travels',
  'name_ar', 'أسفار جدة',
  'legal_name', 'Jeddah Travels',
  'website', 'https://mazarat-sa.online',
  'email', 'admin@mazarat-sa.online',
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
SET company_name = 'Jeddah Travels'
WHERE company_name = 'Taxi Co.';