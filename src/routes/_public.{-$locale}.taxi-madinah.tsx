import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, Car, MapPin, Clock, Shield, Star, Building2, Plane, ArrowRight } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "كيف أحجز تاكسي في المدينة المنورة؟", a: "يمكنك الحجز بسهولة عبر واتساب أو الاتصال المباشر. نوفر رحلات للمسجد النبوي الشريف، المزارات النبوية، ومطار المدينة المنورة (الأمير محمد بن عبدالعزيز)." },
  { q: "هل توفرون خدمة التوصيل بين مكة والمدينة؟", a: `نعم، نقدم خدمة النقل المباشر والآمن بين الحرمين الشريفين بسعر يبدأ من ${getPriceForRoute('makkah-to-med')} ريال لسيارة السيدان.` },
  { q: "ما هي أهم الوجهات السياحية في المدينة التي تخدمونها؟", a: "نوفر رحلات للمزارات مثل مسجد قباء، وجبل أحد، ومقبرة البقيع، بالإضافة إلى المجمعات التجارية والفنادق المحيطة بالمسجد النبوي." },
  { q: "هل لديكم خدمة استقبال من مطار المدينة المنورة؟", a: "نعم، نوفر خدمة الاستقبال بالاسم من مطار الأمير محمد بن عبدالعزيز الدولي وتوصيلك إلى وجهتك بكل راحة وأمان." },
];

const FAQ_EN = [
  { q: "How can I book a taxi for transportation within Madinah?", a: "Booking is simple via WhatsApp or direct call. We provide private transportation to the Prophet's Mosque, local hotels, and historical sites across Madinah." },
  { q: "Do you offer private transfers between Makkah and Madinah?", a: `Yes, we offer direct and safe intercity transfers between the two Holy Cities. Prices start from ${getPriceForRoute('makkah-to-med', 'economyPrice', 'en')} SAR for a sedan.` },
  { q: "What historical sites in Madinah do you serve?", a: "We provide private transfers to major Ziyarat locations including Quba Mosque, Mount Uhud, and the Al-Baqi Cemetery, as well as shopping centers and hotels surrounding the Prophet's Mosque." },
  { q: "Can I book an airport pickup from Madinah Airport (MED)?", a: "Certainly. We offer meet-and-greet services at Prince Mohammad Bin Abdulaziz International Airport, ensuring a comfortable and stress-free transfer to your hotel or residence." },
];

export const Route = createFileRoute("/_public/{-$locale}/taxi-madinah")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/taxi-madinah`;
    const title = ar 
      ? "تاكسي المدينة المنورة | توصيل للمسجد النبوي والمطار - تاكسي العمرة" 
      : "Madinah Taxi | Prophet's Mosque & Airport Transfers";
    const description = ar 
      ? "احجز تاكسي المدينة المنورة الآن. خدمة استقبال من المطار وتوصيل للمسجد النبوي والفنادق بأسعار ثابتة. سيارات حديثة وسائقون محترفون." 
      : "Book your private Madinah taxi for transfers to the Prophet's Mosque, airport pickups at MED, and private local travel. Reliable service for pilgrims and families.";
    
    return {
      meta: [
        { title }, 
        { name: "description", content: description }, 
        { property: "og:title", content: title }, 
        { property: "og:description", content: description }, 
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, { name: ar ? "تاكسي المدينة" : "Madinah Taxi", url }])) },
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) },
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({ name: ar ? "تاكسي المدينة" : "Madinah Private Taxi Service", description, url, areaServed: "Madinah" })) }
      ]
    };
  },
  component: MadinahTaxiPage,
});

function MadinahTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const faqs = ar ? FAQ_AR : FAQ_EN;

  return (
    <article className="container-tight py-16 md:py-24">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي المدينة المنورة" : "Madinah Taxi"}</span>
      </nav>

      <header className="space-y-6 mb-16">
        <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "خدمات النقل في المدينة" : "Madinah Private Chauffeur Services"}</span>
        <h1 className="font-display text-4xl md:text-5xl">{ar ? "تاكسي المدينة المنورة: راحة زوار المسجد النبوي" : "Madinah Taxi & Private Transportation"}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {ar 
            ? "نفتخر بخدمتكم في طيبة الطيبة. توصيل آمن ومريح لجميع وجهاتكم في المدينة المنورة سواء للمسجد النبوي أو المطار." 
            : "We are proud to serve you in the Prophet's City. We offer safe and comfortable private transfers to the Masjid al-Nabawi, sacred historical sites, and Prince Mohammad Bin Abdulaziz International Airport (MED)."}
        </p>
        <div className="flex gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full">
            <a href={waLink(ar ? "أرغب بحجز تاكسي في المدينة" : "Book taxi in Madinah")}>
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "حجز الآن" : "Book Now"}
            </a>
          </Button>
        </div>
      </header>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {[
          { icon: Building2, t_ar: "زيارة المسجد النبوي", t_en: "Prophet's Mosque Transfers" },
          { icon: Plane, t_ar: "مطار المدينة الدولي", t_en: "Madinah Airport (MED)" },
          { icon: MapPin, t_ar: "بين الحرمين الشريفين", t_en: "Intercity to Makkah", path: "/makkah-to-madinah-taxi" },
          { icon: Star, t_ar: "المزارات النبوية", t_en: "Ziyarat & Historical Sites" },
        ].map((s, i) => (
          <div key={i} className="p-6 border rounded-2xl bg-card hover:shadow-md transition-shadow">
            {s.path ? (
              <Link to={withLocale(locale, s.path)} className="group flex flex-col h-full">
                <s.icon className="h-10 w-10 text-gold mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold group-hover:text-gold transition-colors">{ar ? s.t_ar : s.t_en}</h3>
              </Link>
            ) : (
              <div className="flex flex-col h-full">
                <s.icon className="h-10 w-10 text-gold mb-4" />
                <h3 className="font-bold">{ar ? s.t_ar : s.t_en}</h3>
              </div>
            )}
          </div>
        ))}
      </section>

      <CityLongContent page="taxi-madinah" />

      <section className="mb-16">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة عن تاكسي المدينة" : "Madinah Taxi FAQ"}</h2>
        <div className="space-y-4 max-w-4xl">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-bold mb-2">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}