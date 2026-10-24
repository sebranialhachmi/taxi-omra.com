import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { CANONICAL_REDIRECTS } from "@/lib/canonical-redirects";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getCmsPage } from "@/lib/public.functions";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SITE, waLink, telLink } from "@/lib/site-info";
import { buildCmsHead, breadcrumbJsonLd } from "@/lib/seo";
import { buildPageSections, faqJsonLdFor } from "@/lib/page-content";
import { sanitizeHtml } from "@/lib/html";

const opts = (slug: string) => queryOptions({
  queryKey: ["public", "page", slug],
  queryFn: async () => {
    const p = await getCmsPage({ data: { slug } });
    if (!p) throw notFound();
    return p;
  },
});

// Typed CMS pages (city/airport/service/route) have their own section URL;
// the /p/ copy is a duplicate, so 301 it to the final canonical page.
const TYPE_PREFIX: Record<string, string> = {
  city: "/cities", airport: "/airports", service: "/services", route_page: "/routes",
};

export const Route = createFileRoute("/_public/{-$locale}/p/$slug")({
  loader: async ({ context, params }) => {
    const p: any = await context.queryClient.ensureQueryData(opts(params.slug));
    const prefix = TYPE_PREFIX[p?.page_type];
    if (prefix) {
      const typed = `${prefix}/${params.slug}`;
      const final = CANONICAL_REDIRECTS[typed] ?? typed;
      throw redirect({ href: `/${params.locale ?? "ar"}${final}`, statusCode: 301 });
    }
    return p;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const head = buildCmsHead(loaderData as any, (params.locale ?? "ar") === "en" ? "en" : "ar");
    head.scripts = [
      ...(head.scripts ?? []),
      { type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: loaderData.title_en, url: `/p/${params.slug}` },
      ])) },
      { type: "application/ld+json", children: JSON.stringify(faqJsonLdFor(loaderData as any, (params?.locale ?? "ar") === "ar" ? "ar" : "en")) },
    ];
    return head;
  },
  component: PageDetail,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
    </div>
  ),
});

function PageDetail() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const params = Route.useParams();
  const { data: p } = useSuspenseQuery(opts(params.slug));
  const sections = buildPageSections(p as any, ar ? "ar" : "en");

  return (
    <>
      <section className="bg-gradient-to-br from-primary/10 to-background border-b">
        <div className="container mx-auto px-4 py-16 md:py-20 max-w-4xl">
          <div className="inline-block rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1 mb-4">{p.page_type}</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{ar ? p.title_ar : p.title_en}</h1>
          <p className="text-lg text-muted-foreground">{ar ? p.subtitle_ar : p.subtitle_en}</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        {/<[a-z][\s\S]*>/i.test((ar ? p.body_ar : p.body_en) ?? "") ? (
          <div
            className="article-content max-w-none"
            dir={ar ? "rtl" : "ltr"}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml((ar ? p.body_ar : p.body_en) ?? "") }}
          />
        ) : (
          <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-line leading-relaxed text-foreground">
            {ar ? p.body_ar : p.body_en}
          </div>
        )}
        <div className="mt-12 space-y-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">{sections.headings.overview}</h2>
            {sections.intro.map((para, i) => (
              <p key={i} className="leading-relaxed text-muted-foreground whitespace-pre-line">{para}</p>
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
                        <th scope="row" className="text-start font-medium p-3 w-1/2 bg-muted/30">{f.label}</th>
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
                {sections.included.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">{sections.headings.steps}</h2>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal ps-5">
                {sections.steps.map((item) => <li key={item}>{item}</li>)}
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
        </div>

        <div className="mt-10 rounded-2xl border bg-muted/30 p-6 text-center">
          <h2 className="text-xl font-bold mb-3">{ar ? "احجز هذه الخدمة الآن" : "Book this service now"}</h2>
          <p className="text-sm text-muted-foreground mb-5">{ar ? "تواصل مع فريق الحجز مباشرة عبر واتساب أو الاتصال." : "Contact our dispatch team directly via WhatsApp or a phone call."}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700"><a href={waLink((ar ? p.title_ar : p.title_en) + " — " + (ar ? "أرغب بالحجز" : "I'd like to book"))} target="_blank" rel="noopener"><MessageCircle className="h-4 w-4 me-2" />WhatsApp</a></Button>
            <Button asChild variant="outline"><a href={telLink()}><Phone className="h-4 w-4 me-2" />{SITE.phone}</a></Button>
          </div>
        </div>
      </section>
    </>
  );
}
