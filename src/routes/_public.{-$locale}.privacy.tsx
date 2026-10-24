import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/_public/{-$locale}/privacy")({
  head: ({ params }) => {
    const isAr = (params?.locale ?? "ar") === "ar";
    const title = isAr ? `سياسة الخصوصية — ${SITE.brand.ar}` : `Privacy Policy — ${SITE.brand.en}`;
    const description = isAr
      ? "كيف نجمع بياناتك الشخصية ونستخدمها ونحميها في تاكسي العمرة."
      : "How we collect, use, and protect your personal data.";
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
  component: Privacy,
});

function Privacy() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <section className="container-tight py-16 md:py-24 max-w-3xl">
      <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "الخصوصية" : "Privacy"}</span>
      <h1 className="font-display text-5xl mt-4 mb-8">{ar ? "سياسة الخصوصية" : "Privacy Policy"}</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-5 text-muted-foreground leading-relaxed">
        <p>{ar
          ? `نحن في ${SITE.brand.ar} نلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها.`
          : `${SITE.brand.en} is committed to protecting your personal data. This policy explains what we collect, how we use it, and how we protect it.`}</p>
        <h2 className="text-foreground font-display text-2xl">{ar ? "البيانات التي نجمعها" : "Data we collect"}</h2>
        <p>{ar
          ? "الاسم، رقم الهاتف، البريد الإلكتروني، ونقاط الالتقاط والوصول اللازمة لتنفيذ الحجز فقط."
          : "Your name, phone, email, and pickup/drop-off points strictly required to fulfill your booking."}</p>
        <h2 className="text-foreground font-display text-2xl">{ar ? "الاستخدام" : "How we use it"}</h2>
        <p>{ar ? "لتأكيد الحجز، تنسيق السائق، الفوترة، والرد على استفساراتك." : "To confirm bookings, dispatch a chauffeur, invoice, and respond to inquiries."}</p>
        <h2 className="text-foreground font-display text-2xl">{ar ? "الاحتفاظ والحقوق" : "Retention & your rights"}</h2>
        <p>{ar ? "يحق لك طلب حذف أو تعديل بياناتك في أي وقت عبر البريد الإلكتروني أدناه." : "You may request deletion or correction of your data at any time by writing to us."}</p>
        <p><strong>{SITE.email}</strong></p>
      </div>
    </section>
  );
}
