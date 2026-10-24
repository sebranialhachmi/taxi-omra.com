import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getBlogPost } from "@/lib/public.functions";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";
import { renderableContent } from "@/lib/html";
import { isIndexable } from "@/lib/content-quality";
import { isIndexedBlog } from "@/lib/index-policy";
import { blogCoverImage } from "@/lib/blog-images";
import { absoluteUrl, usableImage } from "@/lib/images";
import { breadcrumbJsonLd } from "@/lib/seo";
import { RelatedLinks } from "@/components/public/RelatedLinks";

const opts = (slug: string) => queryOptions({
  queryKey: ["public", "blog", slug],
  queryFn: async () => {
    const p = await getBlogPost({ data: { slug } });
    if (!p) throw notFound();
    return p as any;
  },
});

export const Route = createFileRoute("/_public/{-$locale}/blog/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(opts(params.slug)),
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    const p = loaderData as any;
    const ar = (params?.locale ?? "ar") === "ar";
    // Arabic and English metadata are fully independent — no cross-language fallback.
    const title = ar ? (p.meta_title_ar || p.title_ar) : (p.meta_title || p.title_en);
    const desc = ar ? (p.meta_description_ar || p.excerpt_ar || "") : (p.meta_description || p.excerpt_en || "");
    const image = absoluteUrl(usableImage(p.og_image_url) || blogCoverImage(p));
    const locale = ar ? "ar" : "en";
    const url = `${SITE.url}/${locale}/blog/${p.slug}`;
    // Thin drafts must not be submitted for indexing — Google flags them as
    // soft 404s and that damages crawling of the rest of the site.
    const thin = !isIndexable(ar ? p.content_ar : p.content_en) || !isIndexedBlog(p.slug, p.seo_released);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:locale", content: ar ? "ar_SA" : "en_US" },
        { property: "article:published_time", content: p.published_at ?? "" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(thin ? [{ name: "robots", content: "noindex, follow" }] : []),
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
      links: [],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description: desc,
            image: [image],
            datePublished: p.published_at,
            dateModified: p.updated_at ?? p.published_at,
            inLanguage: locale,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            author: { "@type": "Organization", name: SITE.brand[locale], url: SITE.url },
            publisher: {
              "@type": "Organization",
              name: SITE.brand[locale],
              logo: { "@type": "ImageObject", url: `${SITE.url}${SITE.logo}` },
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: ar ? "الرئيسية" : "Home", url: `/${locale}` },
              { name: ar ? "المدونة" : "Blog", url: `/${locale}/blog` },
              { name: title, url: `/${locale}/blog/${p.slug}` },
            ]),
          ),
        },
      ],
    };
  },
  component: BlogPost,
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Post not found</h1>
    </div>
  ),
});

function BlogPost() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const params = Route.useParams();
  const { data } = useSuspenseQuery(opts(params.slug));
  const p = data as any;
  const html = renderableContent(ar ? p.content_ar : p.content_en);
  const coverAlt = (ar ? p.cover_alt_ar : p.cover_alt_en) || (ar ? p.title_ar : p.title_en);
  const coverImage = blogCoverImage(p);

  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl overflow-x-hidden">
      <figure className="mb-8">
        <img src={coverImage} alt={coverAlt} width={1200} height={675} loading="eager" decoding="async" className="w-full aspect-[16/9] object-cover rounded-2xl" />
        {p.cover_caption && <figcaption className="mt-2 text-sm text-muted-foreground text-center">{p.cover_caption}</figcaption>}
      </figure>
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{ar ? p.title_ar : p.title_en}</h1>
      {p.published_at && <div className="text-sm text-muted-foreground mb-8">{new Date(p.published_at).toLocaleDateString(ar ? "ar" : "en")}</div>}
      <div
        className="article-content max-w-none text-foreground"
        dir={ar ? "rtl" : "ltr"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <RelatedLinks slug={p.slug} locale={locale} />
    </article>
  );
}
