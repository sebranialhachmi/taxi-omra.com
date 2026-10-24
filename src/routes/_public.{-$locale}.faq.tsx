import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listFaqs } from "@/lib/public.functions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

const opts = () => queryOptions({ queryKey: ["public", "faqs"], queryFn: () => listFaqs() });

export const Route = createFileRoute("/_public/{-$locale}/faq")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts()),
  head: ({ params, loaderData }) => {
    const ar = (params.locale ?? "ar") === "ar";
    const title = ar
      ? `الأسئلة الشائعة — الحجز والأسعار وخدمة العمرة | ${SITE.brand.ar}`
      : `FAQ — Booking, Prices & Umrah Chauffeur Service | ${SITE.brand.en}`;
    const description = ar
      ? "إجابات على أكثر الأسئلة تكراراً حول الحجز، الأسعار الثابتة، مدة الانتظار، طرق الدفع، وخدمة التوصيل من مطار جدة إلى مكة."
      : "Answers to the most common questions about booking, fixed fares, waiting time, payment methods, and Jeddah Airport to Makkah transfers.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [],
      scripts: loaderData ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org", "@type": "FAQPage",
          inLanguage: ar ? "ar" : "en",
          mainEntity: loaderData.map((f) => ({
            "@type": "Question",
            name: ar ? f.question_ar : f.question_en,
            acceptedAnswer: { "@type": "Answer", text: ar ? f.answer_ar : f.answer_en },
          })),
        }),
      }] : undefined,
    };
  },
  component: FAQ,
});

function FAQ() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { data } = useSuspenseQuery(opts());
  return (
    <section className="container-tight py-16 md:py-24 max-w-3xl">
      <div className="space-y-5 mb-12">
        <span className="eyebrow"><span className="h-px w-8 bg-gold" />FAQ</span>
        <h1 className="font-display text-5xl md:text-6xl leading-tight">{ar ? "أسئلة متكررة" : "Common questions"}</h1>
        <p className="text-lg text-muted-foreground">{ar ? "كل ما تحتاج معرفته قبل الحجز." : "Everything you need to know before booking."}</p>
      </div>
      <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card divide-y divide-border">
        {data.map((f) => (
          <AccordionItem key={f.id} value={f.id} className="border-b-0 px-6">
            <AccordionTrigger className="text-start font-medium text-base py-5">{ar ? f.question_ar : f.question_en}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-5">{ar ? f.answer_ar : f.answer_en}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
