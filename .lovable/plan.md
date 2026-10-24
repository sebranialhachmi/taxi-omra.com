# خطة بناء منصة إدارة شركة تاكسي

منصة إدارية (Admin only) ثنائية اللغة (عربي/إنجليزي) مع RTL/LTR وDark Mode، مبنية على TanStack Start + React 19 + Tailwind + shadcn/ui + Lovable Cloud (Postgres + Auth + RLS).

## المرحلة 1 — البنية التحتية والقاعدة

1. تفعيل Lovable Cloud (Auth + Postgres).
2. Migration واحدة تنشئ كل الجداول:
   - `profiles` (مربوط بـ `auth.users`)
   - `app_role` enum + `user_roles` + `has_role()` (RBAC آمن)
   - `permissions` + `role_permissions` (صلاحيات دقيقة)
   - `customers`, `drivers`, `vehicle_categories`, `vehicle_category_translations`, `vehicles`
   - `routes`, `pricing_rules`, `coupons`
   - `bookings` (مع حالات: pending/assigned/ongoing/completed/cancelled)
   - `payments`, `notifications`
   - `settings` (key/value)
   - `audit_logs`
   - كل الجداول مع GRANTs + RLS + سياسات (admin يرى الكل، dispatcher حسب الدور).
   - Trigger لإنشاء profile عند التسجيل + trigger لكتابة audit logs على العمليات الحساسة.
3. Seed لأدوار: `admin`, `manager`, `dispatcher`, `accountant` + فئات مركبات افتراضية (Economy/Standard/Business/SUV/Van/Premium) مع ترجماتها.

## المرحلة 2 — الهيكل والتصميم

- i18n خفيف عبر Context (ar/en) + تبديل dir تلقائي على `<html>`.
- Dark mode عبر `class="dark"` مع مبدّل.
- Design system: ألوان أصفر تاكسي + رمادي داكن للأعمال، خطوط Cairo (عربي) / Inter (إنجليزي).
- تخطيط الإدارة: Sidebar قابل للطي + Topbar (بحث، إشعارات، اللغة، الثيم، المستخدم).
- مسار `/auth` عام + كل شيء تحت `_authenticated/` مع فحص دور `admin/manager/dispatcher`.

## المرحلة 3 — الوحدات (كل وحدة: list + create/edit + view)

```text
/                      → Dashboard (widgets: رحلات اليوم، الإيرادات، سائقون متاحون، رحلات نشطة، حجوزات معلقة)
/bookings              → إدارة الحجوزات + معالج حجز جديد (Pickup→Destination→Category→Fare→Assign)
/bookings/$id          → تفاصيل الرحلة + تغيير الحالة + تعيين سائق
/customers             → العملاء
/drivers               → السائقون (ملف، رخصة، مركبة، حالة، أرباح)
/fleet                 → المركبات (لوحة، مقاعد، حالة، صيانة)
/categories            → فئات المركبات + ترجماتها
/routes                → المسارات
/pricing               → التسعير (base/distance/time/waiting/night/airport)
/coupons               → الكوبونات
/payments              → المدفوعات
/notifications         → الإشعارات
/reports               → تقارير (يومي، إيرادات، سائقون، عملاء، مسارات شائعة)
/users                 → إدارة المستخدمين
/roles                 → الأدوار والصلاحيات
/settings              → الإعدادات العامة
/audit                 → سجل التدقيق
```

كل عملية كتابة تمر عبر `createServerFn` مع `requireSupabaseAuth` + فحص دور + Zod validation + كتابة audit log.

## المرحلة 4 — التقارير والحاسبات

- حاسبة أجرة: `base + distance*perKm + time*perMin + waiting + nightSurcharge + airportFee - coupon`.
- تقارير تجميعية عبر SQL views + server functions.

## التفاصيل التقنية

- **قاعدة البيانات**: Postgres مع RLS. كل جدول له سياسات (admin/manager: كل شيء؛ dispatcher: قراءة + تحديث الحجوزات؛ accountant: قراءة + مدفوعات).
- **الأمان**: أدوار في `user_roles` منفصل + `has_role()` كـ SECURITY DEFINER (لا تخزين role في profile).
- **Audit**: كل mutation تكتب في `audit_logs` (user_id, action, entity, entity_id, before, after, ip).
- **الاستعلامات**: TanStack Query + `useSuspenseQuery` + `ensureQueryData` في loaders.
- **الملاحة**: Sidebar shadcn مع نشاط الرابط.

## ملاحظات مهمة

- بحكم الحجم الضخم، سأبني الهيكل الكامل + Dashboard + Bookings + Drivers + Fleet + Auth/RBAC + Audit + Settings في هذه الجولة، ثم نكمل باقي الوحدات (Reports التفصيلية، Coupons، Pricing UI، إلخ) في الجولات التالية للحفاظ على الجودة.
- خرائط GPS الحية والدفع الفعلي (Stripe) والإشعارات اللحظية: يمكن إضافتها لاحقاً عند الطلب.

هل تعتمد الخطة لأبدأ التنفيذ؟