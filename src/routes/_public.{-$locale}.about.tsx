import { createFileRoute } from "@tanstack/react-router";
import { CityLongContent } from "@/components/public/CityLongContent";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { Shield, Award, Users, Clock } from "lucide-react";
import { SITE } from "@/lib/site-info";
import { breadcrumbJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/_public/{-$locale}/about")({
  head: ({ params }) => {
    const ar = (params.locale ?? "ar") === "ar";
    const title = ar
      ? `من نحن — ${SITE.brand.ar} | تاكسي العمرة من مطار جدة إلى مكة`
      : `About Us — ${SITE.brand.en} | Jeddah Airport to Makkah Taxi`;
    const description = ar
      ? "تعرّف على تاكسي العمرة: شركة نقل متخصصة في التوصيل من مطار جدة إلى مكة والمدينة، بسائقين مرخصين وأسطول حديث وخدمة على مدار الساعة."
      : "Learn about Omra Taxi — a licensed Saudi chauffeur company specialising in Jeddah Airport transfers to Makkah and Madinah, with a modern fleet and 24/7 service.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([
          { name: ar ? "الرئيسية" : "Home", url: `${SITE.url}/${ar ? "ar" : "en"}` },
          { name: ar ? "من نحن" : "About", url: `${SITE.url}/${ar ? "ar" : "en"}/about` },
        ])) },
      ],
    };
  },
  component: About,
});

function About() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const values = [
    { icon: Shield, ar_t: "السلامة أولاً", en_t: "Safety first", ar_d: "سائقون مدربون ومركبات مفحوصة دورياً.", en_d: "Trained drivers and regularly inspected vehicles." },
    { icon: Clock, ar_t: "التزام بالوقت", en_t: "On time, always", ar_d: "نصل قبل موعدك ونوفر تتبعاً للرحلة.", en_d: "We arrive before your scheduled time." },
    { icon: Users, ar_t: "خدمة العملاء", en_t: "Customer care", ar_d: "فريق دعم متاح ٢٤ ساعة عبر واتساب والهاتف.", en_d: "24/7 support team on WhatsApp and phone." },
    { icon: Award, ar_t: "جودة معتمدة", en_t: "Certified quality", ar_d: "تراخيص كاملة وتأمين شامل لكل رحلة.", en_d: "Full licensing and comprehensive trip insurance." },
  ];
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{ar ? "من نحن" : "About Us"}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {ar
            ? `${SITE.brand.ar} شركة تاكسي احترافية تقدم خدمات نقل موثوقة على مدار الساعة، مع أسطول حديث وسائقين مرخصين.`
            : `${SITE.brand.en} is a professional taxi company providing reliable transfers 24/7, with a modern fleet and licensed drivers.`}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 mb-16">
        <Card><CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-3">{ar ? "مهمتنا" : "Our Mission"}</h2>
          <p className="text-muted-foreground">{ar ? "توفير خدمة نقل آمنة وموثوقة وبأسعار عادلة لكل عميل، في أي وقت ومن أي مكان." : "Deliver safe, reliable and fairly-priced transportation to every customer, anytime, anywhere."}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-3">{ar ? "رؤيتنا" : "Our Vision"}</h2>
          <p className="text-muted-foreground">{ar ? "أن نكون شركة التاكسي الأولى في المنطقة من حيث الجودة والاعتمادية والابتكار." : "To be the region's leading taxi company in quality, reliability and innovation."}</p>
        </CardContent></Card>
      </div>
      <h2 className="text-2xl font-bold text-center mb-8">{ar ? "قيمنا" : "Our Values"}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => (
          <Card key={v.en_t}><CardContent className="pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3"><v.icon className="h-6 w-6" /></div>
            <h3 className="font-bold mb-2">{ar ? v.ar_t : v.en_t}</h3>
            <p className="text-sm text-muted-foreground">{ar ? v.ar_d : v.en_d}</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <Card><CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-3">{ar ? "العنوان" : "Our Address"}</h2>
          <p className="text-muted-foreground">{SITE.address[locale]}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-3">{ar ? "الرقم الضريبي" : "VAT Registration"}</h2>
          <p className="text-muted-foreground" dir="ltr">{SITE.vatNumber}</p>
        </CardContent></Card>
      </div>
      <CityLongContent page="about" />
    </div>
  );
}
