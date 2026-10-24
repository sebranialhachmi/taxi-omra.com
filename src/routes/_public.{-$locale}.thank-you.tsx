import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageCircle, Phone } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";

export const Route = createFileRoute("/_public/{-$locale}/thank-you")({
  head: ({ params }) => {
    const locale = params.locale ?? "en";
    const ar = locale === "ar";
    const title = ar ? `شكراً — ${SITE.brand.ar}` : `Thank You — ${SITE.brand.en}`;
    return {
      meta: [
        { title },
        { name: "description", content: ar ? "استلمنا طلب حجزك." : "We received your booking request." },
        { name: "robots", content: "noindex,follow" },
      ],
      links: [],
    };
  },
  component: ThankYouPage,
});

function ThankYouPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <section className="container-tight py-24 md:py-32 text-center">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold ring-1 ring-gold/40">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl leading-tight">
          {ar ? "استلمنا طلبك — شكراً لك." : "We received your request — thank you."}
        </h1>
        <p className="text-lg text-muted-foreground">
          {ar
            ? "سيتواصل معك موظف الاستقبال خلال دقائق عبر واتساب لتأكيد السائق والسعر."
            : "Our dispatcher will contact you within minutes on WhatsApp to confirm your driver and fare."}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Button asChild size="lg" className="rounded-full">
            <a href={waLink(ar ? "متابعة الحجز" : "Following up on my booking")} target="_blank" rel="noopener">
              <MessageCircle className="h-5 w-5 me-2" /> {ar ? "افتح واتساب" : "Open WhatsApp"}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <a href={telLink()}>
              <Phone className="h-5 w-5 me-2" /> {SITE.phone}
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full">
            <a href={withLocale(locale, "/")}>{ar ? "العودة للرئيسية" : "Back to home"}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
