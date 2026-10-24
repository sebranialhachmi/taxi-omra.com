import { createServerFn } from "@tanstack/react-start";

export interface PricingRoute {
  id: string;
  from_ar: string;
  from_en: string;
  to_ar: string;
  to_en: string;
  economyPrice?: string; // "Starts from" or "Request price"
  suvPrice?: string;
  vipPrice?: string;
  category: "jeddah" | "makkah" | "madinah" | "taif" | "riyadh" | "dammam" | "airport" | "intercity";
}

export const PRICING_DATA: PricingRoute[] = [
  // ==========================================
  // JEDDAH AIRPORT (JED / KAIA)
  // ==========================================
  { id: "apt-jed-to-jed", from_ar: "مطار جدة (JED)", from_en: "Jeddah Airport (JED)", to_ar: "داخل جدة", to_en: "Within Jeddah", economyPrice: "150", suvPrice: "250", vipPrice: "500", category: "airport" },
  { id: "apt-jed-to-makkah", from_ar: "مطار جدة (JED)", from_en: "Jeddah Airport (JED)", to_ar: "مكة المكرمة", to_en: "Makkah", economyPrice: "200", suvPrice: "350", vipPrice: "500", category: "airport" },
  { id: "apt-jed-to-med", from_ar: "مطار جدة (JED)", from_en: "Jeddah Airport (JED)", to_ar: "المدينة المنورة", to_en: "Madinah", economyPrice: "500", suvPrice: "700", vipPrice: "1000", category: "airport" },
  { id: "apt-jed-to-taif", from_ar: "مطار جدة (JED)", from_en: "Jeddah Airport (JED)", to_ar: "الطائف", to_en: "Taif", economyPrice: "300", suvPrice: "500", vipPrice: "800", category: "airport" },
  { id: "apt-jed-to-taif-rt", from_ar: "مطار جدة (JED)", from_en: "Jeddah Airport (JED)", to_ar: "الطائف (ذهاب وعودة)", to_en: "Taif (Round Trip)", economyPrice: "600", suvPrice: "800", vipPrice: "1000", category: "airport" },
  { id: "apt-jed-to-hotels", from_ar: "مطار جدة (JED)", from_en: "Jeddah Airport (JED)", to_ar: "فنادق جدة", to_en: "Jeddah Hotels", economyPrice: "150", suvPrice: "250", vipPrice: "500", category: "airport" },

  // ==========================================
  // JEDDAH CITY
  // ==========================================
  { id: "jed-to-apt-jed", from_ar: "جدة", from_en: "Jeddah", to_ar: "مطار جدة (JED)", to_en: "Jeddah Airport (JED)", economyPrice: "150", suvPrice: "250", vipPrice: "500", category: "jeddah" },
  { id: "jed-to-makkah", from_ar: "جدة", from_en: "Jeddah", to_ar: "مكة المكرمة", to_en: "Makkah", economyPrice: "200", suvPrice: "350", vipPrice: "600", category: "jeddah" },
  { id: "jed-to-med", from_ar: "جدة", from_en: "Jeddah", to_ar: "المدينة المنورة", to_en: "Madinah", economyPrice: "500", suvPrice: "700", vipPrice: "1000", category: "jeddah" },
  { id: "jed-to-taif-rt", from_ar: "جدة", from_en: "Jeddah", to_ar: "الطائف (ذهاب وعودة)", to_en: "Taif (Round Trip)", economyPrice: "500", suvPrice: "700", vipPrice: "1000", category: "jeddah" },
  { id: "jed-to-train", from_ar: "جدة", from_en: "Jeddah", to_ar: "محطة قطار جدة", to_en: "Jeddah Train Station", economyPrice: "100", suvPrice: "200", vipPrice: "300", category: "jeddah" },
  { id: "jed-to-districts", from_ar: "جدة", from_en: "Jeddah", to_ar: "أحياء جدة", to_en: "Jeddah Districts", economyPrice: "100", suvPrice: "200", vipPrice: "300", category: "jeddah" },
  { id: "jed-to-hotels", from_ar: "جدة", from_en: "Jeddah", to_ar: "فنادق جدة", to_en: "Jeddah Hotels", economyPrice: "100", suvPrice: "200", vipPrice: "300", category: "jeddah" },

  // ==========================================
  // MAKKAH AL MUKARRAMAH
  // ==========================================
  { id: "makkah-to-apt-jed", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "مطار جدة (JED)", to_en: "Jeddah Airport (JED)", economyPrice: "190", suvPrice: "300", vipPrice: "500", category: "makkah" },
  { id: "makkah-to-jed", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "جدة", to_en: "Jeddah", economyPrice: "190", suvPrice: "300", vipPrice: "500", category: "makkah" },
  { id: "makkah-to-med", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "المدينة المنورة", to_en: "Madinah", economyPrice: "400", suvPrice: "600", vipPrice: "1000", category: "makkah" },
  { id: "makkah-to-train", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "محطة قطار مكة", to_en: "Makkah Train Station", economyPrice: "100", suvPrice: "200", vipPrice: "300", category: "makkah" },
  { id: "makkah-to-taneem", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "مسجد عائشة / التنعيم", to_en: "Masjid Aisha / Taneem", economyPrice: "90", suvPrice: "150", vipPrice: "300", category: "makkah" },
  { id: "makkah-to-jaaranah", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "مسجد الجعرانة", to_en: "Masjid Jaaranah", economyPrice: "100", suvPrice: "200", vipPrice: "400", category: "makkah" },
  { id: "makkah-to-taif-rt", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "الطائف (ذهاب وعودة)", to_en: "Taif (Round Trip)", economyPrice: "400", suvPrice: "600", vipPrice: "800", category: "makkah" },
  { id: "makkah-to-ziyarat", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "جولات وزيارات مكة", to_en: "Makkah Ziyarat Tours", economyPrice: "150", suvPrice: "500", vipPrice: "1000", category: "makkah" },
  { id: "makkah-to-haram", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "الحرم المكي", to_en: "Al Haram", economyPrice: "80", suvPrice: "150", vipPrice: "300", category: "makkah" },
  { id: "makkah-to-hotels", from_ar: "مكة المكرمة", from_en: "Makkah", to_ar: "فنادق مكة", to_en: "Makkah Hotels", economyPrice: "80", suvPrice: "150", vipPrice: "300", category: "makkah" },

  // ==========================================
  // MADINAH AL MUNAWWARAH
  // ==========================================
  { id: "apt-med-to-hotel", from_ar: "مطار المدينة (MED)", from_en: "Madinah Airport (MED)", to_ar: "فندق في المدينة", to_en: "Hotel in Madinah", economyPrice: "100", suvPrice: "200", vipPrice: "300", category: "airport" },
  { id: "med-to-makkah", from_ar: "المدينة المنورة", from_en: "Madinah", to_ar: "مكة المكرمة", to_en: "Makkah", economyPrice: "400", suvPrice: "600", vipPrice: "800", category: "madinah" },
  { id: "med-to-apt-jed", from_ar: "المدينة المنورة", from_en: "Madinah", to_ar: "مطار جدة (JED)", to_en: "Jeddah Airport (JED)", economyPrice: "450", suvPrice: "700", vipPrice: "1000", category: "madinah" },
  { id: "med-to-jed", from_ar: "المدينة المنورة", from_en: "Madinah", to_ar: "جدة", to_en: "Jeddah", economyPrice: "450", suvPrice: "700", vipPrice: "1000", category: "madinah" },
  { id: "med-to-train", from_ar: "المدينة المنورة", from_en: "Madinah", to_ar: "محطة قطار المدينة", to_en: "Madinah Train Station", economyPrice: "100", suvPrice: "150", vipPrice: "300", category: "madinah" },
  { id: "med-to-ziyarat", from_ar: "المدينة المنورة", from_en: "Madinah", to_ar: "مزارات + وادي الجن", to_en: "Madinah Ziyarat + Wadi Al-Jinn", economyPrice: "200", suvPrice: "350", vipPrice: "500", category: "madinah" },
  { id: "med-to-hotels", from_ar: "المدينة المنورة", from_en: "Madinah", to_ar: "فنادق المدينة", to_en: "Madinah Hotels", economyPrice: "80", suvPrice: "150", vipPrice: "300", category: "madinah" },

  // ==========================================
  // TAIF
  // ==========================================
  { id: "taif-to-makkah", from_ar: "الطائف", from_en: "Taif", to_ar: "مكة المكرمة", to_en: "Makkah", economyPrice: "اطلب السعر", suvPrice: "اطلب السعر", vipPrice: "اطلب السعر", category: "taif" },
  { id: "taif-to-apt-jed", from_ar: "الطائف", from_en: "Taif", to_ar: "مطار جدة (JED)", to_en: "Jeddah Airport (JED)", economyPrice: "اطلب السعر", suvPrice: "اطلب السعر", vipPrice: "اطلب السعر", category: "taif" },
  { id: "taif-to-jed", from_ar: "الطائف", from_en: "Taif", to_ar: "جدة", to_en: "Jeddah", economyPrice: "اطلب السعر", suvPrice: "اطلب السعر", vipPrice: "اطلب السعر", category: "taif" },
  { id: "taif-to-hotels", from_ar: "الطائف", from_en: "Taif", to_ar: "فنادق الطائف", to_en: "Taif Hotels", economyPrice: "اطلب السعر", category: "taif" },
  { id: "taif-to-ziyarat", from_ar: "الطائف", from_en: "Taif", to_ar: "المعالم السياحية", to_en: "Sightseeing Tours", economyPrice: "اطلب السعر", category: "taif" },

  // ==========================================
  // RIYADH
  // ==========================================
  { id: "apt-ruh-to-city", from_ar: "مطار الرياض (RUH)", from_en: "Riyadh Airport (RUH)", to_ar: "داخل الرياض", to_en: "Within Riyadh", economyPrice: "اطلب السعر", suvPrice: "اطلب السعر", vipPrice: "اطلب السعر", category: "airport" },
  { id: "city-to-apt-ruh", from_ar: "داخل الرياض", from_en: "Within Riyadh", to_ar: "مطار الرياض (RUH)", to_en: "Riyadh Airport (RUH)", economyPrice: "اطلب السعر", category: "riyadh" },
  { id: "riyadh-to-hotels", from_ar: "الرياض", from_en: "Riyadh", to_ar: "فنادق الرياض", to_en: "Riyadh Hotels", economyPrice: "اطلب السعر", category: "riyadh" },
  { id: "riyadh-to-business", from_ar: "الرياض", from_en: "Riyadh", to_ar: "وجهات الأعمال", to_en: "Business Districts", economyPrice: "اطلب السعر", category: "riyadh" },
  { id: "riyadh-to-makkah", from_ar: "الرياض", from_en: "Riyadh", to_ar: "مكة المكرمة", to_en: "Makkah", economyPrice: "اطلب السعر", category: "riyadh" },

  // ==========================================
  // DAMMAM
  // ==========================================
  { id: "apt-dmm-to-city", from_ar: "مطار الدمام (DMM)", from_en: "Dammam Airport (DMM)", to_ar: "داخل الدمام", to_en: "Within Dammam", economyPrice: "اطلب السعر", suvPrice: "اطلب السعر", vipPrice: "اطلب السعر", category: "airport" },
  { id: "dmm-to-khobar", from_ar: "الدمام", from_en: "Dammam", to_ar: "الخبر", to_en: "Khobar", economyPrice: "اطلب السعر", category: "dammam" },
  { id: "dmm-to-dhahran", from_ar: "الدمام", from_en: "Dammam", to_ar: "الظهران", to_en: "Dhahran", economyPrice: "اطلب السعر", category: "dammam" },
  { id: "dmm-to-hotels", from_ar: "الدمام", from_en: "Dammam", to_ar: "فنادق المنطقة الشرقية", to_en: "Eastern Province Hotels", economyPrice: "اطلب السعر", category: "dammam" },
  { id: "dmm-to-makkah", from_ar: "الدمام", from_en: "Dammam", to_ar: "مكة المكرمة", to_en: "Makkah", economyPrice: "اطلب السعر", category: "dammam" },
];

export const getPricingData = createServerFn({ method: "GET" }).handler(async () => {
  return PRICING_DATA;
});

export const getPriceForRoute = (routeId: string, vehicleType: 'economyPrice' | 'suvPrice' | 'vipPrice' = 'economyPrice', locale: 'ar' | 'en' = 'ar') => {
  const route = PRICING_DATA.find(r => r.id === routeId);
  if (!route) return null;
  const price = route[vehicleType];
  if (!price) return null;
  
  if (price === "اطلب السعر") {
    return locale === 'ar' ? "اطلب السعر" : "Contact us for a quote";
  }
  
  return price;
};