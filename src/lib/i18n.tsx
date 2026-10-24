import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useParams, useRouter, useRouterState } from "@tanstack/react-router";
import { SITE } from "@/lib/site-info";

export type Locale = "ar" | "en";
export const LOCALES: Locale[] = ["ar", "en"];
export const DEFAULT_LOCALE: Locale = "ar";

export function isLocale(v: unknown): v is Locale {
  return v === "ar" || v === "en";
}

/** Extract locale from a pathname like /ar/foo, /en, /about → returns locale or undefined. */
export function localeFromPath(pathname: string): Locale | undefined {
  const seg = pathname.split("/").filter(Boolean)[0];
  return isLocale(seg) ? seg : undefined;
}

/** Strip the locale prefix from a pathname; returns "/rest" (leading slash preserved). */
export function stripLocale(pathname: string): string {
  const loc = localeFromPath(pathname);
  if (!loc) return pathname || "/";
  const rest = pathname.slice(("/" + loc).length);
  return rest === "" ? "/" : rest;
}

/** Build a fully-qualified path with the given locale prefix. */
export function withLocale(locale: Locale, pathname: string): string {
  const rest = stripLocale(pathname);
  if (rest === "/" || rest === "") return `/${locale}`;
  return `/${locale}${rest}`;
}

/** Parse the Accept-Language header and return the best-supported locale. */
export function pickLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const parts = header.split(",").map((p) => p.trim().split(";")[0].toLowerCase());
  for (const p of parts) {
    if (p.startsWith("ar")) return "ar";
    if (p.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}

type Dict = Record<string, { ar: string; en: string }>;

const dict: Dict = {
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  bookings: { ar: "الحجوزات", en: "Bookings" },
  customers: { ar: "العملاء", en: "Customers" },
  drivers: { ar: "السائقون", en: "Drivers" },
  fleet: { ar: "الأسطول", en: "Fleet" },
  categories: { ar: "فئات المركبات", en: "Vehicle Categories" },
  routes: { ar: "المسارات", en: "Routes" },
  pricing: { ar: "التسعير", en: "Pricing" },
  coupons: { ar: "الكوبونات", en: "Coupons" },
  payments: { ar: "المدفوعات", en: "Payments" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  reports: { ar: "التقارير", en: "Reports" },
  users: { ar: "المستخدمون", en: "Users" },
  roles: { ar: "الأدوار والصلاحيات", en: "Roles & Permissions" },
  settings: { ar: "الإعدادات", en: "Settings" },
  audit: { ar: "سجل التدقيق", en: "Audit Logs" },
  trips_today: { ar: "رحلات اليوم", en: "Trips Today" },
  revenue: { ar: "الإيرادات", en: "Revenue" },
  available_drivers: { ar: "سائقون متاحون", en: "Available Drivers" },
  active_trips: { ar: "رحلات نشطة", en: "Active Trips" },
  pending_bookings: { ar: "حجوزات معلقة", en: "Pending Bookings" },
  total_customers: { ar: "إجمالي العملاء", en: "Total Customers" },
  search: { ar: "بحث…", en: "Search…" },
  signout: { ar: "تسجيل الخروج", en: "Sign out" },
  signin: { ar: "تسجيل الدخول", en: "Sign in" },
  signup: { ar: "إنشاء حساب", en: "Sign up" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  fullname: { ar: "الاسم الكامل", en: "Full name" },
  new: { ar: "جديد", en: "New" },
  create: { ar: "إنشاء", en: "Create" },
  save: { ar: "حفظ", en: "Save" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  edit: { ar: "تعديل", en: "Edit" },
  delete: { ar: "حذف", en: "Delete" },
  status: { ar: "الحالة", en: "Status" },
  actions: { ar: "إجراءات", en: "Actions" },
  loading: { ar: "جارٍ التحميل…", en: "Loading…" },
  no_data: { ar: "لا توجد بيانات", en: "No data" },
  code: { ar: "الرمز", en: "Code" },
  name: { ar: "الاسم", en: "Name" },
  phone: { ar: "الهاتف", en: "Phone" },
  total: { ar: "الإجمالي", en: "Total" },
  fare: { ar: "الأجرة", en: "Fare" },
  pickup: { ar: "نقطة الانطلاق", en: "Pickup" },
  dropoff: { ar: "الوجهة", en: "Destination" },
  category: { ar: "الفئة", en: "Category" },
  customer: { ar: "العميل", en: "Customer" },
  driver: { ar: "السائق", en: "Driver" },
  vehicle: { ar: "المركبة", en: "Vehicle" },
  plate: { ar: "رقم اللوحة", en: "Plate #" },
  seats: { ar: "المقاعد", en: "Seats" },
  brand: { ar: SITE.brand.ar, en: SITE.brand.en },
  admin_panel: { ar: "لوحة الإدارة", en: "Admin Panel" },
  welcome: { ar: "مرحباً بك", en: "Welcome back" },
  auth_subtitle: { ar: "سجّل الدخول للوصول إلى لوحة الإدارة", en: "Sign in to access the admin panel" },
  toggle_lang: { ar: "العربية / English", en: "English / العربية" },
  toggle_theme: { ar: "الوضع", en: "Theme" },
  overview: { ar: "نظرة عامة", en: "Overview" },
  operations: { ar: "العمليات", en: "Operations" },
  catalog: { ar: "الكتالوج", en: "Catalog" },
  finance: { ar: "المالية", en: "Finance" },
  system: { ar: "النظام", en: "System" },
  book_now: { ar: "احجز الآن", en: "Book Now" },
  new_booking: { ar: "حجز جديد", en: "New Booking" },
  estimated_fare: { ar: "الأجرة المقدرة", en: "Estimated Fare" },
  assign_driver: { ar: "تعيين سائق", en: "Assign Driver" },
  distance_km: { ar: "المسافة (كم)", en: "Distance (km)" },
  duration_min: { ar: "المدة (دقيقة)", en: "Duration (min)" },
};

type Ctx = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: string) => string;
  setLocale: (l: Locale) => void;
};

const I18nCtx = createContext<Ctx | null>(null);

/**
 * URL-first i18n provider. Locale is resolved from:
 *   1. Path prefix /ar or /en (authoritative)
 *   2. DEFAULT_LOCALE ("ar")
 * `setLocale` navigates to the same path with the swapped locale prefix.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // strict:false because I18nProvider wraps every route, not just localized ones.
  const params = useParams({ strict: false }) as { locale?: string };

  const locale: Locale = useMemo(() => {
    if (isLocale(params.locale)) return params.locale;
    const fromUrl = localeFromPath(pathname);
    if (fromUrl) return fromUrl;
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("locale");
        if (isLocale(stored)) return stored;
      } catch {}
    }
    return DEFAULT_LOCALE;
  }, [params.locale, pathname]);

  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", dir);
    try {
      window.localStorage.setItem("locale", locale);
    } catch {}
  }, [locale, dir]);

  const setLocale = (l: Locale) => {
    if (l === locale) return;
    try {
      window.localStorage.setItem("locale", l);
    } catch {}
    const hasLocalePrefix = !!localeFromPath(pathname);
    if (hasLocalePrefix) {
      const target = withLocale(l, pathname);
      router.navigate({ to: target, replace: false });
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const t = (key: string) => dict[key]?.[locale] ?? key;

  return <I18nCtx.Provider value={{ locale, dir, t, setLocale }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
