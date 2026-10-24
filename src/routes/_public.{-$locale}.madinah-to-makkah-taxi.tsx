import { createFileRoute, Link } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, CheckCircle2, MapPin, Clock, Shield, Plane, ArrowRight } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { breadcrumbJsonLd, faqPageJsonLd, serviceJsonLd } from "@/lib/seo";
import { getPriceForRoute } from "@/lib/pricing.functions";

const FAQ_AR = [
  { q: "كم تستغرق الرحلة من المدينة إلى مكة بالتاكسي؟", a: "تستغرق الرحلة حوالي 4 إلى 5 ساعات عبر طريق الهجرة السريع، ونوفر سيارات حديثة ومكيفة بالكامل لضمان راحتكم طوال الطريق." },
  { q: "هل تقدمون خدمة الاستقبال من مطار الأمير محمد بن عبدالعزيز (MED)؟", a: "نعم، نوفر خدمة الاستقبال الشخصي باللوحة من مطار المدينة المنورة والتوصيل المباشر إلى فندقك في مكة المكرمة." },
  { q: "هل هناك توقفات أثناء الطريق لأداء الصلاة أو الاستراحة؟", a: "بالتأكيد، يمكن للسائق التوقف في محطات الاستراحة المعتمدة للصلاة أو تناول الطعام حسب رغبتكم." },
];

const FAQ_EN = [
  { q: "How long is the taxi journey from Madinah to Makkah?", a: "The private transfer takes approximately 4 to 5 hours via the Al-Hijrah Highway. We use modern, air-conditioned vehicles to ensure a pleasant trip." },
  { q: "Do you provide airport pickup at Madinah Airport (MED)?", a: "Yes, we offer professional meet-and-greet services at Prince Mohammad Bin Abdulaziz International Airport with direct transfer to your Makkah hotel." },
  { q: "Can we stop for prayer or refreshments during the trip?", a: "Yes, our drivers are happy to stop at clean highway rest areas for prayers or snacks whenever you need." },
];

export const Route = createFileRoute("/_public/{-$locale}/madinah-to-makkah-taxi")({
  head: ({ params }) => {
    const locale = params.locale ?? "ar";
    const ar = locale === "ar";
    const url = `${SITE.url}/${locale}/madinah-to-makkah-taxi`;
    const title = ar 
      ? "تاكسي من المدينة إلى مكة | حجز استقبال مطار المدينة - تاكسي العمرة" 
      : "Madinah to Makkah Taxi | Private Umrah Transfer Services";
    const description = ar 
      ? "احجز تاكسي خاص من المدينة المنورة إلى مكة المكرمة. استقبال من مطار المدينة وفنادق المدينة المنورة، سيارات حديثة وسائقين محترفين. خدمة 24 ساعة." 
      : "Book your private Madinah to Makkah transfer. Professional taxi service from Madinah Airport or hotels to Makkah. Modern fleet and dedicated Umrah chauffeurs.";
    return {
      meta: [
        { title }, { name: "description", content: description }, 
        { property: "og:title", content: title }, { property: "og:description", content: description }, 
        { property: "og:url", content: url },
        { name: "keywords", content: ar 
          ? "توصيل من المدينة الى مكة، تاكسي مطار المدينة مكة، حجز سيارة من المدينة الى مكة، نقل المعتمرين من المدينة" 
          : "Madinah to Makkah taxi, Madinah to Makkah private transfer, taxi from Madinah Airport to Makkah, Umrah taxi Madinah" }
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${locale}` }, { name: ar ? "تاكسي المدينة إلى مكة" : "Madinah to Makkah Taxi", url }])) },
        { type: "application/ld+json", children: JSON.stringify(faqPageJsonLd(ar ? FAQ_AR : FAQ_EN)) },
        { type: "application/ld+json", children: JSON.stringify(serviceJsonLd({ name: ar ? "توصيل من المدينة إلى مكة" : "Madinah to Makkah Taxi", description, url, areaServed: "Makkah" })) }
      ]
    };
  },
  component: MadinahToMakkahTaxiPage,
});

function MadinahToMakkahTaxiPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const price = getPriceForRoute('med-to-makkah', 'economyPrice', locale as any);

  return (
    <article className="container-tight py-16 md:py-24">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to={withLocale(locale, "/")} className="hover:text-foreground">{ar ? "الرئيسية" : "Home"}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{ar ? "تاكسي المدينة إلى مكة" : "Madinah to Makkah Taxi"}</span>
      </nav>
      
      <header className="space-y-6 mb-16">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight">
          {ar ? "تاكسي من المدينة المنورة إلى مكة المكرمة" : "Private Taxi from Madinah to Makkah"}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          {ar 
            ? `انتقل براحة تامة بين الحرمين الشريفين. نقدم خدمة نقل خاصة ومباشرة من المدينة المنورة إلى مكة بأسعار تبدأ من ${price} ريال.` 
            : `Travel in total comfort between the Holy Cities. We provide direct private transfers from Madinah to Makkah with rates starting from ${price} SAR.`}
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <Button asChild size="lg" className="rounded-full h-14 px-8 bg-primary">
            <a href={waLink(ar ? "أرغب بحجز تاكسي من المدينة إلى مكة" : "Book taxi from Madinah to Makkah")} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "احجز عبر واتساب" : "Book via WhatsApp"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full h-14 px-8">
            <a href={telLink()}><Phone className="h-5 w-5 me-2" /> {SITE.phone}</a>
          </Button>
        </div>
      </header>

      <section className="grid md:grid-cols-2 gap-12 mb-20">
        <div className="space-y-6">
          <h2 className="font-display text-3xl">{ar ? "خدمة نقل المعتمرين والزوار" : "Dedicated Transfer for Pilgrims"}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {ar 
              ? "نحن نتفهم خصوصية هذه الرحلة، لذا نوفر سيارات حديثة ونظيفة وسائقين محترفين يضمنون لك الهدوء والراحة خلال الطريق الطويل من المدينة إلى مكة." 
              : "We understand the importance of this spiritual journey. Our modern, clean vehicles and professional chauffeurs ensure a quiet and comfortable experience during the long drive from Madinah to Makkah."}
          </p>
          <ul className="space-y-4">
            {[
              ar ? "استقبال من الفندق أو مطار المدينة" : "Pickup from hotels or Madinah Airport",
              ar ? "مساحة واسعة للحقائب وماء بارد" : "Ample luggage space and cold water",
              ar ? "سائقون خبراء بطريق الهجرة" : "Experienced drivers familiar with Hijrah Road",
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-gold shrink-0" /> {t}</li>
            ))}
          </ul>
        </div>
        <div className="bg-muted rounded-3xl p-8 space-y-6 border border-border/50">
          <h3 className="font-display text-2xl">{ar ? "معلومات الرحلة" : "Route Information"}</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground">{ar ? "المسافة" : "Distance"}</span>
              <span className="font-semibold">450 KM</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground">{ar ? "مدة الرحلة" : "Duration"}</span>
              <span className="font-semibold">{ar ? "4.5 - 5 ساعات" : "4.5 - 5 Hours"}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground">{ar ? "نوع الخدمة" : "Service Type"}</span>
              <span className="font-semibold">{ar ? "خاصة بالكامل" : "100% Private"}</span>
            </div>
          </div>
        </div>
      </section>

      <CityLongContent page="madinah-to-makkah-taxi" />
      <section className="mb-20">
        <h2 className="font-display text-3xl mb-8 border-b pb-4">{ar ? "الأسئلة الشائعة" : "Route FAQs"}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {(ar ? FAQ_AR : FAQ_EN).map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-bold mb-3">{f.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-sm font-medium border-t pt-8 mb-16">
        <span>{ar ? "روابط ذات صلة:" : "Related Routes:"}</span>
        <Link to={withLocale(locale, "/makkah-to-madinah-taxi")} className="text-gold hover:underline">{ar ? "تاكسي مكة إلى المدينة" : "Makkah to Madinah Taxi"}</Link>
        <Link to={withLocale(locale, "/taxi-madinah")} className="text-gold hover:underline">{ar ? "تاكسي المدينة" : "Madinah Taxi"}</Link>
        <Link to={withLocale(locale, "/routes/madinah-to-jeddah")} className="text-gold hover:underline">{ar ? "المدينة إلى جدة" : "Madinah to Jeddah"}</Link>
      </div>
    </article>
  );
}
