import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/_public/{-$locale}/cancellation")({
  head: ({ params }) => {
    const isAr = (params?.locale ?? "ar") === "ar";
    const title = isAr ? `سياسة الإلغاء — ${SITE.brand.ar}` : `Cancellation Policy — ${SITE.brand.en}`;
    const description = isAr
      ? "كيفية إلغاء حجز التاكسي، نوافذ الإشعار، والرسوم المطبقة قبل موعد الالتقاط."
      : "How to cancel a taxi booking, notice windows, and applicable fees.";
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
  component: CancellationPage,
});

function CancellationPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <section className="container-tight py-16 md:py-24 max-w-3xl">
      <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "الإلغاء" : "Cancellation"}</span>
      <h1 className="font-display text-5xl mt-4 mb-8">{ar ? "سياسة الإلغاء" : "Cancellation Policy"}</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-5 text-muted-foreground leading-relaxed">
        <p>{ar
          ? `يمكنك إلغاء حجزك مع ${SITE.brand.ar} في أي وقت. تختلف الرسوم بحسب توقيت الإلغاء قبل موعد الالتقاط.`
          : `You can cancel your booking with ${SITE.brand.en} at any time. Fees depend on how close the cancellation is to the pickup time.`}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "قبل ٢٤ ساعة أو أكثر" : "24+ hours before pickup"}</h2>
        <p>{ar
          ? "إلغاء مجاني بالكامل، ويتم استرداد أي مبلغ مدفوع خلال أيام العمل التالية."
          : "Free cancellation. Any pre-payment is refunded within the following business days."}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "بين ٢٤ و ٣ ساعات قبل الرحلة" : "Between 24 and 3 hours before pickup"}</h2>
        <p>{ar
          ? "يستقطع رسم إداري بنسبة ٢٥٪ من قيمة الرحلة."
          : "A 25% administrative fee is retained from the fare."}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "أقل من ٣ ساعات قبل الرحلة" : "Less than 3 hours before pickup"}</h2>
        <p>{ar
          ? "يستحق ٥٠٪ من قيمة الرحلة لتعويض تجهيز السائق والمركبة."
          : "50% of the fare is due to compensate for driver and vehicle preparation."}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "عدم الحضور" : "No-shows"}</h2>
        <p>{ar
          ? "يعتبر الحجز \"عدم حضور\" إذا لم يصل العميل بعد ١٥ دقيقة من موعد الالتقاط دون تواصل. تُحسب قيمة الرحلة كاملة."
          : "A booking is a no-show if the passenger does not appear within 15 minutes of pickup and cannot be reached. The full fare is charged."}</p>

        <h2 className="text-foreground font-display text-2xl">{ar ? "كيفية الإلغاء" : "How to cancel"}</h2>
        <p>{ar
          ? "أرسل لنا رسالة عبر الواتساب أو الاتصال مع ذكر رقم الحجز. سيقوم فريقنا بتأكيد الإلغاء والرسوم إن وجدت."
          : "Send us a WhatsApp message or call, quoting the booking number. Our team will confirm the cancellation and any applicable fee."}</p>

        <p><strong>{SITE.email}</strong> · <strong>{SITE.phone}</strong></p>
      </div>
    </section>
  );
}
