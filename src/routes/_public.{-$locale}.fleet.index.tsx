import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listVehicleCategories } from "@/lib/public.functions";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { useI18n, withLocale } from "@/lib/i18n";
import { SITE, waLink } from "@/lib/site-info";
import { categoryImage, categoryAlt } from "@/lib/fleet-images";

const opts = () => queryOptions({ queryKey: ["public", "fleet"], queryFn: () => listVehicleCategories() });
const FEATURES = [
  { ar: "مقاعد جلدية", en: "Leather interior" },
  { ar: "واي‑فاي مجاني", en: "Complimentary Wi-Fi" },
  { ar: "مياه ومناديل", en: "Water & refreshments" },
  { ar: "أمتعة كبيرة", en: "Ample luggage space" },
];

export const Route = createFileRoute("/_public/{-$locale}/fleet/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts()),
  head: ({ params }) => {
    const ar = (params.locale ?? "ar") === "ar";
    const title = ar
      ? `الأسطول — سيدان و GMC وهايس وفانات عائلية | ${SITE.brand.ar}`
      : `Our Fleet — Sedan, GMC SUV, Hiace & Family Vans | ${SITE.brand.en}`;
    const description = ar
      ? "أسطول حديث لتوصيل العمرة والمطار: سيدان أعمال، GMC يوكن، تويوتا هايس، وفانات عائلية. مقاعد جلدية، واي‑فاي مجاني، سائقون مرخصون."
      : "Modern fleet for Umrah and airport transfers: business sedan, GMC Yukon, Toyota Hiace, and family vans. Leather seats, complimentary Wi-Fi, licensed chauffeurs.";
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
    };
  },
  component: Fleet,
});

function Fleet() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { data } = useSuspenseQuery(opts());
  const items = data.length > 0 ? data : [
    { id: "s", code: "sedan", seats: 3, base_fare: 80, price_per_km: 3, vehicle_category_translations: [{ locale: "en", name: "Business Sedan", description: "Mercedes E-Class or similar" }, { locale: "ar", name: "سيدان أعمال", description: "مرسيدس E-Class أو ما يشابهها" }] },
    { id: "u", code: "suv", seats: 5, base_fare: 120, price_per_km: 4, vehicle_category_translations: [{ locale: "en", name: "Executive SUV", description: "Cadillac Escalade or Range Rover" }, { locale: "ar", name: "SUV تنفيذي", description: "كاديلاك إسكاليد أو رينج روفر" }] },
    { id: "v", code: "van", seats: 7, base_fare: 160, price_per_km: 5, vehicle_category_translations: [{ locale: "en", name: "Group Van", description: "Mercedes V-Class for groups" }, { locale: "ar", name: "فان جماعي", description: "مرسيدس V-Class للمجموعات" }] },
  ];

  return (
    <>
      <section className="container-tight py-16 md:py-24">
        <div className="max-w-3xl space-y-5">
          <span className="eyebrow"><span className="h-px w-8 bg-gold" />{ar ? "الأسطول" : "The Fleet"}</span>
          <h1 className="font-display text-5xl md:text-6xl leading-tight text-balance">
            {ar ? "أسطول مختار بعناية. لكل رحلة، السيارة الأنسب." : "A hand-picked fleet. The right car for every journey."}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {ar ? "من السيدان الفاخر إلى الفانات العائلية، جميع سياراتنا حديثة، مؤمّنة بالكامل، ومصانة بأعلى معايير السلامة." : "From executive sedans to spacious vans — every vehicle is late-model, fully insured, and maintained to the highest safety standard."}
          </p>
        </div>
      </section>

      <section className="container-tight pb-24 space-y-8">
        {items.map((c: any, i: number) => {
          const tr = c.vehicle_category_translations?.find((t: any) => t.locale === locale) || c.vehicle_category_translations?.[0];
          const img = categoryImage(c, i);
          const alt = categoryAlt(c, locale);
          const flip = i % 2 === 1;
          return (
            <article key={c.id} className="hover-lift grid gap-8 md:gap-12 lg:grid-cols-12 items-center rounded-3xl border border-border bg-card p-6 md:p-10">
              <div className={`lg:col-span-7 relative aspect-[16/10] overflow-hidden rounded-2xl bg-primary ${flip ? "lg:order-2" : ""}`}>
                <img src={img} alt={alt} width={1200} height={800} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                <div className="absolute top-4 start-4 rounded-full bg-primary/70 backdrop-blur px-3 py-1 text-xs uppercase tracking-wider text-primary-foreground">{c.code}</div>
              </div>
              <div className={`lg:col-span-5 space-y-6 ${flip ? "lg:order-1" : ""}`}>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.22em] text-gold">{ar ? "الفئة" : "Category"} 0{i + 1}</div>
                  <h2 className="font-display text-4xl leading-tight">{tr?.name ?? c.code}</h2>
                  <p className="text-muted-foreground leading-relaxed">{tr?.description ?? ""}</p>
                </div>
                <dl className="grid grid-cols-3 gap-4 py-4 border-y border-border/60">
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "الركاب" : "Passengers"}</dt><dd className="font-display text-2xl mt-1 flex items-center gap-2"><Users className="h-4 w-4 text-gold" />{c.seats}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "من" : "Base"}</dt><dd className="font-display text-2xl mt-1">{c.base_fare}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{ar ? "لكل كم" : "Per km"}</dt><dd className="font-display text-2xl mt-1">{c.price_per_km}</dd></div>
                </dl>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  {FEATURES.map((f) => (
                    <li key={f.en} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0" /><span className="text-muted-foreground">{ar ? f.ar : f.en}</span></li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="rounded-full h-12 px-6">
                    <a href={waLink(ar ? `أرغب بحجز ${tr?.name}` : `Booking inquiry — ${tr?.name}`)} target="_blank" rel="noopener">
                      <MessageCircle className="h-5 w-5 me-2" /> {ar ? "احجز هذه السيارة" : "Reserve this vehicle"}
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-6">
                    <a href={withLocale(locale, `/fleet/${c.code}`)}>
                      {ar ? "التفاصيل" : "View details"} <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
                    </a>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}

        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <Briefcase className="h-8 w-8 text-gold mx-auto mb-3" />
          <h3 className="font-display text-2xl mb-2">{ar ? "تحتاج شيئاً مختلفاً؟" : "Need something different?"}</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">{ar ? "من الليموزين إلى الحافلات الصغيرة — نحن نرتّب المركبات الخاصة عند الطلب." : "From stretch limousines to mini-coaches, we arrange bespoke vehicles on request."}</p>
          <Button asChild variant="outline" className="rounded-full"><a href={waLink()} target="_blank" rel="noopener">{ar ? "تواصل معنا" : "Get in touch"} <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" /></a></Button>
        </div>
      </section>
    </>
  );
}
