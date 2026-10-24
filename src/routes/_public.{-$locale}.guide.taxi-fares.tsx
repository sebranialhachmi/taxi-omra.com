import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getPricingData, getPriceForRoute } from "@/lib/pricing.functions";
import { useI18n, withLocale } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Car, Info, MapPin, Plane, Hotel, Navigation } from "lucide-react";
import { SITE, waLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";
import { Button } from "@/components/ui/button";

const FAQ = [
  { 
    q_ar: "كم سعر التاكسي من مطار جدة إلى مكة؟", 
    a_ar: `يبدأ السعر من ${getPriceForRoute('apt-jed-to-makkah', 'economyPrice') || '200'} ريال لسيارة السيدان. نؤكد السعر النهائي قبل الرحلة بناءً على التفاصيل.`, 
    q_en: "How much is a taxi from Jeddah Airport to Makkah?", 
    a_en: `Fares start from ${getPriceForRoute('apt-jed-to-makkah', 'economyPrice') || '200'} SAR for a sedan. We confirm the final fare before your trip based on details.` 
  },
  { 
    q_ar: "هل الأسعار ثابتة أم تقديرية؟", 
    a_ar: "الأسعار المعروضة تقديرية وتبدأ من المبالغ الموضحة. قد تختلف حسب نوع السيارة، عدد الركاب، ووقت الرحلة. للحصول على السعر النهائي المؤكد، يرجى التواصل معنا عبر واتساب.", 
    q_en: "Are fares fixed or estimated?", 
    a_en: "The displayed fares are estimated and start from the shown amounts. They may vary based on vehicle type, number of passengers, and trip time. For a final confirmed price, please contact us via WhatsApp." 
  },
  {
    q_ar: "ما هي فئات السيارات المتوفرة؟",
    a_ar: "نوفر ثلاث فئات: اقتصادية (كامري/أكورد)، عائلية (هايس/ستاركس)، وفاخرة (VIP).",
    q_en: "What vehicle categories are available?",
    a_en: "We offer three categories: Economy (Camry/Accord), Family/SUV (Hiace/Starex), and Luxury (VIP)."
  }
];

export const Route = createFileRoute("/_public/{-$locale}/guide/taxi-fares")({
  loader: ({ context }) => context.queryClient.ensureQueryData({
    queryKey: ["pricing-data"],
    queryFn: getPricingData,
  }),
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const title = ar ? "أسعار التاكسي والتوصيل في السعودية | تاكسي العمرة" : "Taxi & Transfer Fares in Saudi Arabia | Omra Taxi";
    const description = ar 
      ? "دليل شامل لأسعار التاكسي والتوصيل بين المدن والمطارات في السعودية. جدة، مكة، المدينة، الرياض، والدمام." 
      : "Comprehensive guide to taxi and transfer fares between cities and airports in Saudi Arabia. Jeddah, Makkah, Madinah, Riyadh, and Dammam.";
    return {
      meta: [
        { title }, 
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "keywords", content: ar ? "أسعار تاكسي مكة، سعر توصيل مطار جدة، تاكسي المدينة المنورة، مواصلات الرياض، أسعار النقل في السعودية" : "Makkah taxi fares, Jeddah airport transfer price, Madinah taxi, Riyadh transport, Saudi Arabia transfer prices" }
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(FAQ.map(f => ({ q: ar ? f.q_ar : f.q_en, a: ar ? f.a_ar : f.a_en })))) }
      ]
    };
  },
  component: PricingPage,
});

function PricingPage() {
  const { data: routes } = useSuspenseQuery({ queryKey: ["pricing-data"], queryFn: getPricingData });
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const categories = [
    { id: "all", label: ar ? "الكل" : "All" },
    { id: "airport", label: ar ? "المطارات" : "Airports" },
    { id: "jeddah", label: ar ? "جدة" : "Jeddah" },
    { id: "makkah", label: ar ? "مكة" : "Makkah" },
    { id: "madinah", label: ar ? "المدينة" : "Madinah" },
    { id: "taif", label: ar ? "الطائف" : "Taif" },
    { id: "riyadh", label: ar ? "الرياض" : "Riyadh" },
    { id: "dammam", label: ar ? "الدمام" : "Dammam" },
  ];

  const filtered = useMemo(() => {
    return routes.filter((r) => {
      const matchesSearch = (r.from_ar + r.from_en + r.to_ar + r.to_en).toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeTab === "all" || r.category === activeTab;
      return matchesSearch && matchesCategory;
    });
  }, [routes, search, activeTab]);

  return (
    <article className="container py-16 md:py-24 max-w-6xl">
      <header className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-balance">
          {ar ? "أسعار التاكسي والتوصيل في السعودية" : "Taxi & Transfer Fares in Saudi Arabia"}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {ar 
            ? "دليل شامل وشفاف لأسعار خدمات التوصيل بين المدن والمطارات الرئيسية. نحن نضمن لك أفضل قيمة مقابل المال مع خدمة احترافية." 
            : "A comprehensive and transparent guide for transfer fares between major cities and airports. We guarantee the best value for money with professional service."}
        </p>
      </header>

      <div className="max-w-2xl mx-auto mb-16 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-gold transition-colors" />
        <Input 
          className="h-14 pl-12 rounded-full border-border bg-card shadow-sm text-lg focus-visible:ring-gold" 
          placeholder={ar ? "ابحث عن مدينة أو مطار أو مسار محدد..." : "Search for city, airport, or specific route..."} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto p-2 bg-muted/50 rounded-2xl justify-center mb-12 gap-2">
          {categories.map((c) => (
            <TabsTrigger 
              key={c.id} 
              value={c.id} 
              className="px-6 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:text-gold data-[state=active]:shadow-sm transition-all"
            >
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="space-y-6">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 text-start font-bold">{ar ? "من" : "From"}</th>
                    <th className="px-6 py-4 text-start font-bold">{ar ? "إلى" : "To"}</th>
                    <th className="px-6 py-4 text-center font-bold">{ar ? "اقتصادية" : "Economy"}</th>
                    <th className="px-6 py-4 text-center font-bold">SUV / {ar ? "عائلي" : "Family"}</th>
                    <th className="px-6 py-4 text-center font-bold">VIP / {ar ? "فاخر" : "Luxury"}</th>
                    <th className="px-6 py-4 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gold shrink-0" />
                          <span className="font-medium text-lg">{ar ? r.from_ar : r.from_en}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Navigation className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
                          <span className="font-medium text-lg">{ar ? r.to_ar : r.to_en}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <PriceDisplay price={r.economyPrice} locale={locale} />
                      </td>
                      <td className="px-6 py-5 text-center">
                        <PriceDisplay price={r.suvPrice} locale={locale} />
                      </td>
                      <td className="px-6 py-5 text-center">
                        <PriceDisplay price={r.vipPrice} locale={locale} />
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Button asChild size="sm" variant="outline" className="rounded-full border-gold text-gold hover:bg-gold hover:text-white">
                          <a href={waLink(ar ? `أرغب بحجز رحلة من ${r.from_ar} إلى ${r.to_ar}` : `Book trip from ${r.from_en} to ${r.to_en}`)} target="_blank" rel="noopener">
                            {ar ? "حجز" : "Book"}
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">{ar ? "لم يتم العثور على مسارات تطابق بحثك." : "No routes found matching your search."}</p>
            </div>
          )}
        </div>
      </Tabs>

      <section className="mt-24 grid md:grid-cols-3 gap-8">
        {[
          { 
            title_ar: "اقتصادية", 
            title_en: "Economy", 
            desc_ar: "كامري / أكورد أو ما يعادلها (1-3 ركاب)", 
            desc_en: "Camry / Accord or equivalent (1-3 passengers)", 
            price_ar: "تبدأ من 90 ريال", 
            price_en: "From 90 SAR" 
          },
          { 
            title_ar: "عائلية / مجموعات", 
            title_en: "Family / Groups", 
            desc_ar: "هايس / ستاركس أو ما يعادلها (7-14 راكب)", 
            desc_en: "Hiace / Starex or equivalent (7-14 passengers)", 
            price_ar: "تبدأ من 350 ريال", 
            price_en: "From 350 SAR" 
          },
          { 
            title_ar: "VIP / فاخرة", 
            title_en: "VIP / Luxury", 
            desc_ar: "لكزس / BMW / مرسيدس أو ما يعادلها", 
            desc_en: "Lexus / BMW / Mercedes or equivalent", 
            price_ar: "تبدأ من 300 ريال", 
            price_en: "From 300 SAR" 
          },
        ].map((v, i) => (
          <Card key={i} className="border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-8 text-center space-y-4">
              <Car className="h-12 w-12 text-gold mx-auto" />
              <h3 className="text-2xl font-display">{ar ? v.title_ar : v.title_en}</h3>
              <p className="text-muted-foreground">{ar ? v.desc_ar : v.desc_en}</p>
              <div className="text-gold font-bold text-lg">{ar ? v.price_ar : v.price_en}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-24 bg-muted/40 p-8 md:p-12 rounded-[2rem] border border-border">
        <h2 className="text-3xl font-display mb-8 text-center">{ar ? "معلومات هامة عن الأسعار" : "Important Fare Information"}</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Info className="h-5 w-5 text-gold" />
              {ar ? "ملاحظات تقديرية" : "Estimated Notes"}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {ar 
                ? "الأسعار المعروضة تقديرية وتبدأ من الأسعار الموضحة، وقد تختلف حسب نوع السيارة، عدد الركاب، الأمتعة، وقت الرحلة، نقطة الالتقاء والوجهة والخدمات الإضافية. للحصول على السعر النهائي، تواصل معنا عبر واتساب." 
                : "The displayed fares are estimated and start from the shown amounts. They may vary based on vehicle type, number of passengers, luggage, trip time, pickup point, destination, and extra services. For a final price, contact us via WhatsApp."}
            </p>
            <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground shadow-lg h-14 px-8 w-full md:w-auto">
              <a href={waLink(ar ? "أرغب بالاستفسار عن سعر رحلة" : "Inquire about trip fare")} target="_blank" rel="noopener">
                {ar ? "استفسر الآن عبر واتساب" : "Inquire via WhatsApp"}
              </a>
            </Button>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-bold">{ar ? "الأسئلة الشائعة" : "FAQs"}</h3>
            <div className="space-y-4">
              {FAQ.map((f, i) => (
                <div key={i} className="bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                  <h4 className="font-bold mb-2 text-sm">{ar ? f.q_ar : f.q_en}</h4>
                  <p className="text-xs text-muted-foreground">{ar ? f.a_ar : f.a_en}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-24 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} {ar ? SITE.brand.ar : SITE.brand.en}. {ar ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
        <div className="mt-4 flex justify-center gap-6">
          <Link to={withLocale(locale, "/taxi-jeddah")} className="hover:text-gold">{ar ? "تاكسي جدة" : "Jeddah Taxi"}</Link>
          <Link to={withLocale(locale, "/taxi-makkah")} className="hover:text-gold">{ar ? "تاكسي مكة" : "Makkah Taxi"}</Link>
          <Link to={withLocale(locale, "/taxi-madinah")} className="hover:text-gold">{ar ? "تاكسي المدينة" : "Madinah Taxi"}</Link>
          <Link to={withLocale(locale, "/jeddah-airport-taxi")} className="hover:text-gold">{ar ? "تاكسي المطار" : "Airport Taxi"}</Link>
        </div>
      </footer>
    </article>
  );
}

function PriceDisplay({ price, locale }: { price?: string, locale: string }) {
  const ar = locale === "ar";
  if (!price) return <span className="text-muted-foreground text-sm">{ar ? "حسب الطلب" : "On request"}</span>;
  if (price === "اطلب السعر") return <span className="text-muted-foreground text-sm">{ar ? "اطلب السعر" : "Request quote"}</span>;
  
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-muted-foreground mb-0.5">{ar ? "يبدأ من" : "From"}</span>
      <span className="text-gold font-bold text-xl leading-none">
        {price} 
        <span className="text-xs font-normal ms-1 text-muted-foreground">{ar ? "ريال" : "SAR"}</span>
      </span>
    </div>
  );
}