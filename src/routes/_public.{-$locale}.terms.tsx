import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/_public/{-$locale}/terms")({
  head: ({ params }) => {
    const isAr = (params?.locale ?? "ar") === "ar";
    const title = isAr ? `شروط الخدمة — ${SITE.brand.ar}` : `Terms of Service — ${SITE.brand.en}`;
    const description = isAr
      ? "الشروط التي تحكم استخدام خدمات السائق الخاص لدى تاكسي العمرة."
      : "The terms that govern the use of our chauffeur services.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "robots", content: "index,follow" },
      ],
      links: [],
    };
  },
  component: Terms,
});

function Terms() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <section className="container-tight py-16 md:py-24 max-w-3xl">
      <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "الشروط" : "Terms"}</span>
      <h1 className="font-display text-5xl mt-4 mb-8">{ar ? "شروط الخدمة" : "Terms of Service"}</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-5 text-muted-foreground leading-relaxed">
        <p>{ar
          ? `باستخدامك لخدمات ${SITE.brand.ar} فإنك توافق على الشروط التالية.`
          : `By using ${SITE.brand.en} services you agree to the following terms.`}</p>
        <h2 className="text-foreground font-display text-2xl">{ar ? "الحجز والإلغاء" : "Bookings & cancellation"}</h2>
        <p>{ar ? "يُنشأ الحجز بعد تأكيد مكتوب عبر الواتساب أو الاتصال. سياسة الإلغاء تختلف حسب نوع الرحلة." : "A booking is created after written confirmation via WhatsApp or phone. Cancellation policies vary by trip type."}</p>
        <h2 className="text-foreground font-display text-2xl">{ar ? "الدفع" : "Payment"}</h2>
        <p>{ar ? "الدفع بالنقد، البطاقة، التحويل البنكي، أو الفاتورة للحسابات المؤسسية." : "Cash, card, bank transfer, or invoiced billing for corporate accounts."}</p>
        <h2 className="text-foreground font-display text-2xl">{ar ? "المسؤولية" : "Liability"}</h2>
        <p>{ar ? "نحرص على الوصول في الوقت المحدد، ونستثني الظروف الخارجة عن سيطرتنا." : "We commit to punctual arrival, excluding circumstances beyond our control."}</p>
      </div>
    </section>
  );
}
