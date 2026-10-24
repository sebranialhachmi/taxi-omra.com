INSERT INTO public.blog_posts (slug, title_en, title_ar, excerpt_en, excerpt_ar, meta_title, meta_description, meta_title_ar, meta_description_ar, cover_url, cover_alt_en, cover_alt_ar, content_format, status, published, published_at, content_en, content_ar)
VALUES (
 'rich-editor-smoke-test',
 'Rich Editor Smoke Test','اختبار المحرر المتقدم',
 'Structure test','اختبار البنية',
 'Rich Editor Smoke Test | Umrah Taxi','English meta description for the smoke test article.',
 'اختبار المحرر المتقدم | تاكسي العمرة','وصف عربي مستقل لاختبار المحرر المتقدم.',
 '/__l5e/assets-v1/4244ce2d-046c-4e18-9750-bef967514b9a/economy.jpg',
 'Economy sedan for Jeddah transfers','سيارة اقتصادية لتوصيل جدة',
 'html','draft', false, now(),
 '<h1>Should become H2</h1><h2>Fares</h2><p>Intro with <strong>bold</strong> and <em>italic</em> and <a href="/en/taxi-jeddah">a link</a>.</p><ul><li>One</li><li>Two</li></ul><ol><li>First</li></ol><table><thead><tr><th>Route</th><th>Sedan</th></tr></thead><tbody><tr><td>Jeddah to Makkah</td><td>200 SAR</td></tr></tbody></table><img src="/__l5e/assets-v1/4244ce2d-046c-4e18-9750-bef967514b9a/economy.jpg" alt="Private taxi from Jeddah Airport to Makkah"><script>alert(1)</script><p onclick="evil()">clean</p><h3>Notes</h3><blockquote>Quote</blockquote>',
 '<h2>الأسعار</h2><p>مقدمة عربية مع <strong>نص عريض</strong>.</p><table><thead><tr><th>المسار</th><th>سيدان</th></tr></thead><tbody><tr><td>جدة إلى مكة</td><td>200 ريال</td></tr></tbody></table>'
)
ON CONFLICT (slug) DO UPDATE SET content_en = EXCLUDED.content_en, content_ar = EXCLUDED.content_ar;