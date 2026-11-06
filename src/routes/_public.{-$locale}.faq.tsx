import { breadcrumbJsonLd } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listFaqs } from "@/lib/public.functions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "@tanstack/react-router";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

const opts = () => queryOptions({ queryKey: ["public", "faqs"], queryFn: () => listFaqs() });

export const Route = createFileRoute("/_public/{-$locale}/faq")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts()),
  head: ({ params, loaderData }) => {
    const ar = (params.locale ?? "ar") === "ar";
    const title = ar
      ? `الأسئلة الشائعة: الحجز والأسعار | ${SITE.brand.ar}`
      : `FAQ: Booking, Fares & Umrah Taxi Service | ${SITE.brand.en}`;
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
      scripts: loaderData ? [
        { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: ar ? "الرئيسية" : "Home", url: `/${params.locale ?? "ar"}` }, { name: ar ? "الأسئلة الشائعة" : "FAQ", url: `/${params.locale ?? "ar"}/faq` }])) },
      {
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
      <h2 className="font-display text-2xl mb-4">{ar ? "قبل أن تقرأ الأسئلة" : "Before you read the questions"}</h2>
      <p className="text-muted-foreground leading-relaxed mb-8">
        {ar
          ? "نجيب هنا عن أكثر ما يسأل عنه الزوار: كيف يتم الحجز، وهل السعر ثابت، ومتى يُدفع، وكيف يتم الاستقبال في المطار. إن لم تجد إجابة سؤالك فراسلنا على واتساب ونرد عليك."
          : "Here we answer what visitors ask most: how booking works, whether the fare is fixed, when to pay, and how airport pickup works. If you do not find your answer, message us on WhatsApp and we will reply."}
      </p>
      <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card divide-y divide-border">
        {data.map((f) => (
          <AccordionItem key={f.id} value={f.id} className="border-b-0 px-6">
            <AccordionTrigger className="text-start font-medium text-base py-5">{ar ? f.question_ar : f.question_en}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-5">{ar ? f.answer_ar : f.answer_en}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <h2 className="font-display text-2xl mt-12 mb-4">{ar ? "صفحات قد تهمك" : "Pages you may need"}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {[
          ["/jeddah-airport-taxi", ar ? "تاكسي مطار جدة" : "Jeddah airport taxi"],
          ["/taxi-jeddah", ar ? "تاكسي جدة" : "Taxi in Jeddah"],
          ["/guide/taxi-fares", ar ? "دليل أسعار التاكسي" : "Taxi fares guide"],
          ["/contact", ar ? "تواصل معنا وحجز واتساب" : "Contact and WhatsApp booking"],
        ].map(([to, label]) => (
          <li key={to}><Link to={withLocale(locale, to) as any} className="text-primary underline-offset-4 hover:underline">{label}</Link></li>
        ))}
      </ul>
    </section>
  );
}
