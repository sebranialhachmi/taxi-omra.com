
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='settings' AND policyname='settings_public_head_read') THEN
    CREATE POLICY "settings_public_head_read"
    ON public.settings
    FOR SELECT
    TO anon, authenticated
    USING (key IN (
      'google_site_verification',
      'bing_site_verification',
      'head_meta_custom',
      'head_scripts_custom',
      'whatsapp_number',
      'whatsapp_default_message'
    ));
  END IF;
END $$;

GRANT SELECT ON public.settings TO anon;

INSERT INTO public.settings (key, value, description) VALUES
  ('google_site_verification', '""'::jsonb, 'Google Search Console verification code (content of the meta tag)'),
  ('bing_site_verification',   '""'::jsonb, 'Bing Webmaster verification code (content of the meta tag)'),
  ('head_meta_custom',         '""'::jsonb, 'Custom raw HTML injected into <head> (meta tags, links)'),
  ('head_scripts_custom',      '""'::jsonb, 'Custom raw <script> tags injected into <head> (Analytics, Pixel, GTM, etc.)'),
  ('whatsapp_number',          '"966551796487"'::jsonb, 'WhatsApp number for the floating button (E.164 without +)'),
  ('whatsapp_default_message', '"مرحباً، أرغب في حجز تاكسي"'::jsonb, 'Default WhatsApp message text')
ON CONFLICT (key) DO NOTHING;
