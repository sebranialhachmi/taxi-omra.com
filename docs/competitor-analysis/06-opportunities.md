# 06 · Opportunity Register

Each row = a competitor gap → a concrete page/feature we can ship. Ordered by expected impact ÷ effort.

| # | Opportunity | Gap in competitors | Delivery | Impact | Effort |
|---|---|---|---|---|---|
| O1 | Programmatic route pages `/routes/{from}-{to}` | 10/11 missing | Route generator + Trip schema | H | M |
| O2 | Per-terminal KAIA pages (T1/T2/N/S) | 11/11 missing | Airport child routes + Airport schema | H | M |
| O3 | Bilingual reciprocal hreflang + x-default | 11/11 partial/missing | Head meta + sitemap alternates | H | S |
| O4 | Full JSON-LD stack | 11/11 partial | LocalBusiness+Breadcrumb+FAQ+Service+Trip+Vehicle+Article+WebSite | H | S |
| O5 | Split XML sitemap index | 11/11 monolithic/missing | `sitemap-index.xml` + per-type sitemaps | M | S |
| O6 | Sticky Phone + WhatsApp FABs | Only 3/11 have both | Already shipped | — | — |
| O7 | FAQ with schema | Partial on most | `/faq` bilingual + FAQPage | M | S |
| O8 | Editorial blog cadence | Missing or stale | CMS blog + Article schema | M | M |
| O9 | Transparent price bands | Missing | Price band component per route/vehicle | H | M |
| O10 | On-time / SLA guarantee | Missing | Trust block + policy page | M | S |
| O11 | Verified reviews block | Partial | Review component + Review schema | M | M |
| O12 | Per-vehicle class pages | Fleet gallery only | Vehicle route + Product schema | M | M |
| O13 | Faster CWV than every competitor | Median weak | Image budget, LQIP, code-split, edge-cached OG | H | M |
| O14 | Accessibility AA | None audited | Semantic HTML, ARIA, focus rings | M | S |
| O15 | Corporate / B2B landing | Weak on all | `/services/corporate` + lead form | M | S |
| O16 | Umrah/Hajj checklist pillars | Thin on all | Long-form guides + internal links | H | M |
| O17 | Miqat / holy-site pickup pages | Missing | Sub-pages under airport/routes | M | M |
| O18 | Structured data testing in CI | None | Lint step for JSON-LD | M | S |
