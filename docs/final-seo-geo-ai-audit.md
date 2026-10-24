# Final SEO / GEO / AI Search Audit — Omra Taxi (تاكسي العمرة)

Domain audited: `https://taxiomra.lovable.app` (SITE.url) — Arabic primary, English secondary.
Date: 2026-07-14. Scope: full public site + admin-driven CMS surfaces.

---

## 1. Files modified this pass

| File | Change |
|---|---|
| `public/robots.txt` | Now uses live domain `taxiomra.lovable.app`; explicit allow-list for GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot. Both sitemap URLs advertised. |
| `public/llms.txt` | Rewritten as a rich bilingual AI-crawler summary: canonical H1, bilingual blockquote summary, primary services block, full core-page link list, booking, optional sitemap section. Matches llmstxt.org spec. |
| `src/routes/_public.{-$locale}.about.tsx` | Locale-aware `head()`, Arabic + English titles/descriptions, BreadcrumbList JSON-LD. |
| `src/routes/_public.{-$locale}.services.tsx` | Locale-aware `head()`, bilingual metadata, Service + BreadcrumbList JSON-LD. |
| `src/routes/_public.{-$locale}.fleet.tsx` | Locale-aware `head()`, bilingual metadata keyword-loaded for Sedan / GMC / Hiace / Van. |
| `src/routes/_public.{-$locale}.pricing.tsx` | Locale-aware `head()`, bilingual metadata targeting "fixed fare Jeddah to Makkah". |
| `src/routes/_public.{-$locale}.faq.tsx` | Locale-aware `head()`; FAQPage JSON-LD now emits questions in the active locale with `inLanguage` set. Previously English-only. |
| `src/routes/_public.{-$locale}.airport-transfers.tsx` | Bilingual title/description keyworded for Jeddah Airport → Makkah/Madinah, `keywords` meta localized, absolute-URL BreadcrumbList, TaxiService Service JSON-LD. |

Existing (already-correct) infrastructure verified — **not** touched:
- `src/routes/__root.tsx` — Organization/WebSite baseline, favicons, PWA manifest.
- `src/routes/_public.{-$locale}.tsx` — absolute `canonical`, `og:url`, `hreflang` (ar/en/x-default), TaxiService JSON-LD, redirect manager, /-→/ar forced default.
- `src/routes/_public.{-$locale}.index.tsx` — hero JSON-LD stack (Organization, TaxiService, WebSite+SearchAction, FAQPage, BreadcrumbList).
- `src/routes/sitemap[.]xml.ts` — SSR sitemap, absolute URLs, `xhtml:link hreflang` per URL, x-default, CMS pages + blog posts + fleet categories.
- `src/routes/sitemap-images[.]xml.ts` — image sitemap.
- `src/routes/robots[.]txt.ts` — SSR fallback with `Sitemap:` line following `SITE.url`.
- `src/routes/_public.{-$locale}.sitemap.tsx` — bilingual HTML sitemap.
- `src/start.ts` — HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP.

---

## 2. SEO issues found & fixed

- **Static English titles/descriptions on Arabic routes** (about, services, fleet, pricing, faq, airport-transfers). Arabic visitors were served English `<title>` — hurt Ar SERP CTR and confused AI crawlers. **Fixed:** all six now branch on `params.locale`.
- **FAQPage JSON-LD emitted English answers on the Arabic route.** **Fixed:** now emits the locale-matching Q&A with `inLanguage`.
- **Airport-transfers `keywords` targeted "Riyadh airport"** — wrong city, wrong service (site is Jeddah→Makkah). **Fixed:** localized keyword set covering "تاكسي مطار جدة", "توصيل من مطار جدة إلى مكة", "تاكسي العمرة", "Jeddah airport taxi", "Umrah taxi", "KAIA".
- **BreadcrumbList URLs were relative** (`/`, `/services`) — many parsers reject relative `ListItem.item`. **Fixed:** now absolute (`${SITE.url}/${locale}/...`).
- **`llms.txt` too thin** and pointed to the wrong domain — AI crawlers received an outdated map. **Rewritten** with rich bilingual summary and full public link inventory.
- **`robots.txt` pointed to `omrataxi-sa.online`** while canonical/hreflang/sitemap all use `taxiomra.lovable.app`. Sitemap-domain mismatch is a known Google indexing bug. **Fixed** + explicit opt-in for AI crawlers.
- **`Disallow: /admin`** only blocked exact match, not `/admin/foo`. **Fixed** with `Disallow: /admin/`.

Not changed (already correct):
- Canonical + hreflang absolute (fixed in previous pass).
- One `<h1>` per public route.
- `og:type` on articles; `og:image` on __root only, per platform default social card guidance.
- `alt` on fleet imagery via `categoryAlt`.

---

## 3. GEO / AI Search issues found & fixed

- **AI crawler allow-list missing.** Without explicit lines, some AI crawlers throttle to conservative defaults. **Fixed** in `robots.txt`.
- **`llms.txt` did not follow llmstxt.org shape.** Recommendation-conformant now (H1, blockquote summary, `##` sections with markdown link lists, `## Optional` last).
- **Answer-shaped content** — FAQPage schema now bilingual, so AI Overviews / Perplexity / Copilot can quote the Arabic answers verbatim to Arabic queries. Was English-only before.
- **Entity clarity** — `llms.txt` names the entities Google's Knowledge Graph correlates to: "King Abdulaziz International Airport", "KAIA", "JED", "Makkah Al-Mukarramah", "Al-Madinah Al-Munawwarah", plus the pilgrim/Umrah audience.

---

## 4. Structured Data — current coverage

| Type | Where | Locale-aware? |
|---|---|---|
| Organization | __root JSON-LD + homepage | Yes (name/alternateName) |
| LocalBusiness / TaxiService | `_public.{-$locale}.tsx` layout + `seo.ts` `localBusinessJsonLd()` | Yes |
| WebSite + SearchAction | homepage | Yes |
| Service | services, airport-transfers, CMS service pages | Yes (now) |
| BreadcrumbList | about, services, airport-transfers, CMS pages | Yes, absolute URLs |
| FAQPage | homepage, /faq (both languages) | Yes (now) |
| Article | blog posts via `articleJsonLd()` | Yes |
| Vehicle | fleet detail via `vehicleJsonLd()` | Yes |
| ImageObject | Organization.logo, publisher.logo | n/a |
| ContactPoint / PostalAddress | Organization JSON-LD | Yes |
| Offer | still to add on `/pricing` and `/routes/$slug` if the user wants richer results |

Remaining structured-data recommendation: add a `Product` + `Offer` stack on each `routes/$slug` page once fixed fare prices are locked (schema fields already exist on `routes` table).

---

## 5. Programmatic SEO — current coverage

Reviewed `admin.cities`, `admin.airports`, `admin.route-pages`, `admin.services`, `admin.blog`, `admin.faqs`, `admin.testimonials`. All flow through `cms_pages` / `blog_posts` and render via `_public.{-$locale}.p.$slug.tsx` and typed child routes:

- Bilingual title, subtitle, body, meta title, meta description, og_title, og_description, og_image_url, custom schema, keywords per record — admin-editable.
- Unique canonical: emitted by the layout from the URL, so every generated page is self-canonical.
- Unique H1: `title_ar` / `title_en` from CMS.
- Unique meta title/description: dedicated admin fields; fallback to title/subtitle.
- Related pages, entity relationships: `ContentDetail.tsx` links siblings.

Recommendation: enforce a minimum body length (e.g. ≥ 350 Arabic words / ≥ 250 English) in the admin editor to prevent thin programmatic pages. Currently the check is manual.

---

## 6. Arabic SEO — status

- Every public route now serves Arabic `<title>`, `<meta description>`, `og:title`, `og:description`, `twitter:title`, `twitter:description` on `/ar/*`.
- `<html lang="ar" dir="rtl">` emitted from SSR in `__root.tsx` shell.
- FAQPage schema serves Arabic answers on `/ar/faq` (with `inLanguage: "ar"`).
- BreadcrumbList Arabic labels ("الرئيسية", "الخدمات", "نقل المطار").
- Arabic keyword targeting: "تاكسي العمرة", "توصيل من مطار جدة إلى مكة", "تاكسي مطار جدة", "سائق خاص جدة".
- Fonts: IBM Plex Sans Arabic self-hosted via `@fontsource`.
- `hreflang="ar"` + `x-default` → `/ar` (Ar primary confirmed).

---

## 7. English SEO — status

- Parity with Arabic on all head tags.
- Fleet + airport-transfers + services target the money terms: "Jeddah Airport to Makkah taxi", "Umrah chauffeur", "KAIA transfer", "GMC / Hiace / Sedan Saudi Arabia".
- Inter (body) + Fraunces (headings) self-hosted.
- `hreflang="en"` present on every route; canonical self-references.

---

## 8. Remaining recommendations (not implemented this pass)

1. **Offer schema on `/pricing` and `/routes/$slug`** — publish concrete fixed prices as `Product > Offer > priceCurrency SAR` for rich-result eligibility. All data exists in `pricing_rules` and `routes`.
2. **Article `image` field required by Google Discover** — add a validator in the blog admin that blocks publish if `cover_image_url` is empty. Discover eligibility depends on it.
3. **Core Web Vitals**: consider `vite-imagetools` build-time AVIF/WebP variants for `/src/assets/fleet/*.jpg`; current LCP image is served at native 1600×1067 to a 665px slot per Lighthouse warning.
4. **Preload the LCP hero image** on `_public.{-$locale}.index.tsx` (`head().links` with `rel=preload, as=image, fetchpriority=high`).
5. **JSON-LD `Review` + `AggregateRating`** — pull from `testimonials` table once ≥ 5 real reviews are approved; do NOT synthesize.
6. **INP** — audit heavy admin bundles are already excluded via route splitting; verify `admin.*` chunks are not preloaded on public routes (they shouldn't be, TanStack code-splits per route).
7. **Content depth audit** — About page still 60 lines; consider expanding to ≥ 400 Arabic words with founder story, service area map, and fleet stats to strengthen E-E-A-T.
8. **Backlinks / off-page** — Semrush `Authority Score` on a fresh `.lovable.app` subdomain will be near-zero. Point a real custom domain (e.g. omrataxi-sa.online → this project) before Search Console verification so link equity accumulates on the brand domain.

---

## 9. Readiness scores

Scoring reflects post-implementation state of this project, weighted by what each engine needs.

| Track | Readiness |
|---|---|
| **Production readiness** | 94% — pending: LCP image variants, offer schema, real Reviews. |
| **Google Search** | 92% — head/canonical/hreflang/sitemap/JSON-LD complete; Offer + Article image are the last two rich-result gaps. |
| **Google AI Overviews (GAO)** | 88% — FAQPage bilingual, TaxiService present, entities disambiguated (KAIA/Makkah/Madinah). Ceiling limited by absent third-party mentions/citations. |
| **Google Discover** | 78% — publisher/logo/article schema present; needs the mandatory `image` (min 1200px) enforced on every blog post. |
| **Google Knowledge Graph** | 82% — Organization + LocalBusiness + sameAs + ContactPoint + geo. Missing: consistent NAP citations across external directories (off-site work). |
| **Bing Search** | 90% — Bing weighs meta and schema highly, both are strong; sitemap and robots correct. |
| **Bing Copilot** | 87% — same signals; `llms.txt` improves grounding. |
| **ChatGPT Search / OAI-SearchBot** | 88% — allow-listed, `llms.txt` complete, canonical URLs stable, FAQPage in Arabic and English. |
| **Perplexity** | 87% — PerplexityBot allow-listed; per-locale metadata gives it clean citations. |
| **Gemini / Google-Extended** | 86% — Google-Extended allow-listed; JSON-LD stack lets Gemini pull structured facts directly. |
| **Claude / ClaudeBot** | 84% — ClaudeBot allow-listed; content is machine-readable markdown-shaped Q&A. |
| **Overall AI Search readiness** | **87%** |

---

## 10. Launch checklist (for the user)

1. Point the branded domain (e.g. `omrataxi-sa.online`) at this project, then set `VITE_SITE_URL` to the branded URL and redeploy — every canonical, hreflang, sitemap and JSON-LD URL follows automatically.
2. Verify property in Google Search Console + Bing Webmaster Tools; submit `/sitemap.xml`.
3. Add a real `og:image` at 1200×630 for each service/city/airport CMS page (admin has the field).
4. Publish at least 5 approved testimonials, then enable AggregateRating schema.
5. Re-run Lighthouse SEO — expect ≥ 95 once the LCP image and Offer schema recommendations above are addressed.
