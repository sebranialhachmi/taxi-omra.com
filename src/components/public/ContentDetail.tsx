// Shared UI for public content detail pages (city, airport, route, service).
// Renders hero, body, breadcrumbs, CTAs, and a related-content grid.
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, ChevronRight } from "lucide-react";
import { useI18n, withLocale, type Locale } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { buildPageSections } from "@/lib/page-content";
import { sanitizeHtml } from "@/lib/html";

export type CmsPageRow = {
  slug: string;
  page_type: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  body_ar: string | null;
  body_en: string | null;
  hero_image_url: string | null;
  og_image_url: string | null;
};

export type RelatedRow = Pick<
  CmsPageRow,
  "slug" | "title_ar" | "title_en" | "subtitle_ar" | "subtitle_en" | "hero_image_url" | "page_type"
>;

export interface Breadcrumb {
  name: string;
  to: string; // locale-less path, e.g. "/services"
}

export function ContentDetail(props: {
  page: CmsPageRow;
  section: {
    /** URL segment for the section index page, e.g. "services", "cities", "airports", "routes". */
    slug: string;
    ar: string;
    en: string;
  };
  breadcrumbs: Breadcrumb[];
  related: RelatedRow[];
  /** Route pattern relative to the locale prefix, e.g. "/services/$slug". */
  relatedRoutePattern: string;
}) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const p = props.page;
  const title = ar ? p.title_ar : p.title_en;
  const subtitle = ar ? p.subtitle_ar : p.subtitle_en;
  const heroImg = p.hero_image_url || p.og_image_url;
  const sections = buildPageSections(p as any, locale);
  const body = (ar ? p.body_ar : p.body_en)?.trim() || null;

  const bookText = `${title} — ${ar ? "أرغب بالحجز" : "I'd like to book"}`;

  return (
    <>
      {/* Breadcrumbs */}
      <nav
        aria-label={ar ? "مسار التنقل" : "Breadcrumb"}
        className="container mx-auto px-4 pt-6 text-sm text-muted-foreground"
      >
        <ol className="flex flex-wrap items-center gap-1">
          {props.breadcrumbs.map((b, i) => {
            const isLast = i === props.breadcrumbs.length - 1;
            return (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />}
                {isLast ? (
                  <span aria-current="page" className="text-foreground">{b.name}</span>
                ) : (
                  <LocalizedLink to={b.to} locale={locale} className="hover:text-foreground">
                    {b.name}
                  </LocalizedLink>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Hero */}
      <section className="relative border-b">
        {heroImg && (
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center opacity-15"
            style={{ backgroundImage: `url(${heroImg})` }}
            aria-hidden="true"
          />
        )}
        <div className="container mx-auto px-4 py-14 md:py-20 max-w-4xl">
          <div className="inline-block rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1 mb-4 uppercase tracking-wide">
            {ar ? props.section.ar : props.section.en}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{title}</h1>
          {subtitle && <p className="text-lg text-muted-foreground max-w-2xl">{subtitle}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <a href={waLink(bookText)} target="_blank" rel="noopener">
                <MessageCircle className="h-4 w-4 me-2" />
                {ar ? "احجز عبر واتساب" : "Book on WhatsApp"}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={telLink()}>
                <Phone className="h-4 w-4 me-2" />
                {SITE.phone}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Body + generated supporting content */}
      <section className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
        {body &&
          (/<[a-z][\s\S]*>/i.test(body) ? (
            <div
              className="article-content max-w-none"
              dir={ar ? "rtl" : "ltr"}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
            />
          ) : (
            <div className="leading-relaxed text-muted-foreground whitespace-pre-line">
              {body}
            </div>
          ))}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{sections.headings.overview}</h2>
          {sections.intro.map((para, i) => (
            <p key={i} className="leading-relaxed text-muted-foreground whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>

        {sections.facts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">{sections.headings.facts}</h2>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <tbody>
                  {sections.facts.map((f) => (
                    <tr key={f.label} className="border-b last:border-0">
                      <th scope="row" className="text-start font-medium p-3 w-1/2 bg-muted/30">
                        {f.label}
                      </th>
                      <td className="p-3">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold mb-4">{sections.headings.included}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc ps-5">
              {sections.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">{sections.headings.steps}</h2>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal ps-5">
              {sections.steps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">{sections.headings.faq}</h2>
          <div className="space-y-5">
            {sections.faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-semibold mb-1">{f.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky CTA card */}
      <section className="container mx-auto px-4 pb-12 max-w-4xl">
        <div className="rounded-2xl border bg-muted/30 p-6 text-center">
          <h2 className="text-xl font-bold mb-3">
            {ar ? "احجز رحلتك الآن" : "Book your trip now"}
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            {ar
              ? "فريقنا متاح ٢٤ ساعة عبر واتساب أو الاتصال — تأكيد فوري وأسعار ثابتة."
              : "Our team is available 24/7 via WhatsApp or phone — instant confirmation and fixed fares."}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <a href={waLink(bookText)} target="_blank" rel="noopener">
                <MessageCircle className="h-4 w-4 me-2" />WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={telLink()}>
                <Phone className="h-4 w-4 me-2" />{SITE.phone}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Related */}
      {props.related.length > 0 && (
        <section className="container mx-auto px-4 pb-20 max-w-6xl">
          <h2 className="text-2xl font-bold mb-6">
            {ar ? "محتوى ذو صلة" : "Related"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {props.related.map((r) => (
              <RelatedCard
                key={r.slug}
                row={r}
                locale={locale}
                routePattern={props.relatedRoutePattern}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function RelatedCard({
  row,
  locale,
  routePattern,
}: {
  row: RelatedRow;
  locale: Locale;
  routePattern: string;
}) {
  const ar = locale === "ar";
  // Build a locale-prefixed URL from the pattern by substituting $slug.
  const path = withLocale(locale, routePattern.replace("$slug", row.slug));
  return (
    <Link
      to={path}
      className="group block rounded-xl border bg-card overflow-hidden transition hover:shadow-md hover:-translate-y-0.5"
    >
      {row.hero_image_url && (
        <div
          className="aspect-[16/9] bg-cover bg-center"
          style={{ backgroundImage: `url(${row.hero_image_url})` }}
          aria-hidden="true"
        />
      )}
      <div className="p-5">
        <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition">
          {ar ? row.title_ar : row.title_en}
        </h3>
        {(ar ? row.subtitle_ar : row.subtitle_en) && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {ar ? row.subtitle_ar : row.subtitle_en}
          </p>
        )}
      </div>
    </Link>
  );
}

// Small helper: use plain <a> for locale-prefixed static section URLs so we
// don't need to enumerate every route in the type-safe Link generic.
function LocalizedLink({
  to,
  locale,
  className,
  children,
}: {
  to: string;
  locale: Locale;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={withLocale(locale, to)} className={className}>
      {children}
    </a>
  );
}
