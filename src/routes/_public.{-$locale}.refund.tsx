import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/_public/{-$locale}/refund")({
  head: ({ params }) => {
    const isAr = (params?.locale ?? "ar") === "ar";
    const title = isAr ? `سياسة الاسترداد — ${SITE.brand.ar}` : `Refund Policy — ${SITE.brand.en}`;
    const description = isAr
      ? "سياسة الاسترداد لحجوزات تاكسي العمرة، الإلغاءات، والرسوم المتنازع عليها."
      : "Our refund policy for taxi bookings, cancellations, and disputed charges.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "robots", content: "index,follow" },
      ],
      links: [],
    };
  },
  component: RefundPage,
});

function RefundPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <section className="container-tight py-16 md:py-24 max-w-3xl">
      <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "الاسترجاع" : "Refunds"}</span>
      <h1 className="font-display text-5xl mt-4 mb-8">{ar ? "سياسة الاسترداد" : "Refund Policy"}</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-5 text-muted-foreground leading-relaxed">
        <p>{ar
          ? `توضح هذه السياسة الحالات التي يحق لك فيها استرداد المبالغ المدفوعة لخدمات ${SITE.brand.ar}.`
          : `This policy explains when you are eligible for a refund on fares and services paid to ${SITE.brand.en}.`}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "الاسترداد الكامل" : "Full refund"}</h2>
        <p>{ar
          ? "يحق لك استرداد كامل المبلغ في حال إلغاء الحجز قبل موعد الالتقاط بأكثر من ٢٤ ساعة، أو في حال تعذّر تنفيذ الرحلة بسبب ظرف من طرفنا."
          : "You are entitled to a full refund when a booking is cancelled more than 24 hours before pickup, or when we cannot fulfil the trip for reasons on our side."}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "الاسترداد الجزئي" : "Partial refund"}</h2>
        <p>{ar
          ? "الإلغاء خلال ٢٤ ساعة قبل الرحلة يخضع لاستقطاع رسم إداري (٢٥٪ من قيمة الرحلة) لتغطية تجهيز السائق والمركبة."
          : "Cancellations within 24 hours of pickup are subject to an administrative fee of 25% of the fare, covering driver and vehicle preparation."}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "بدون استرداد" : "Non-refundable"}</h2>
        <p>{ar
          ? "لا يستحق الاسترداد في حالة عدم الحضور (No-Show) بعد انتظار السائق ١٥ دقيقة عند نقطة الالتقاط دون تواصل، أو بعد بدء الرحلة."
          : "No refund is due for no-shows (after the chauffeur has waited 15 minutes at pickup with no contact), or after the trip has commenced."}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "طريقة الاسترداد" : "How refunds are issued"}</h2>
        <p>{ar
          ? "تتم عملية الاسترداد إلى نفس وسيلة الدفع الأصلية خلال ٧–١٤ يوم عمل من موافقة الفريق المالي."
          : "Refunds are returned to the original payment method within 7–14 business days of finance approval."}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "كيف أطلب استرداد؟" : "Requesting a refund"}</h2>
        <p>{ar
          ? "يُرجى مراسلتنا عبر البريد الإلكتروني مع ذكر رقم الحجز والسبب. سيتواصل معك فريق الدعم خلال ٤٨ ساعة."
          : "Email us with your booking number and the reason. Our support team will respond within 48 hours."}</p>

        <p><strong>{SITE.email}</strong></p>
      </div>
    </section>
  );
}
