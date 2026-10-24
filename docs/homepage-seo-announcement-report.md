# Homepage SEO Overhaul + Announcement Bar — Report

## 1. Homepage SEO (AR/EN)

**Titles**
- AR: `تاكسي العمرة | التوصيل من مطار جدة إلى مكة المكرمة ٢٤/٧`
- EN: `Umrah Taxi | Taxi from Jeddah Airport to Makkah — 24/7 Transfers`

**Meta descriptions** rewritten around the primary keyword ("التوصيل من مطار جدة إلى مكة" / "Taxi from Jeddah Airport to Makkah") and secondary intents (Umrah transport, KAIA meet & greet, fixed fares, WhatsApp booking).

**Keywords targeted (topical authority)**
- Primary: Umrah Taxi, Taxi from Jeddah Airport to Makkah, Jeddah Airport Transfer.
- Cluster: Makkah Taxi, Madinah Airport Transfer, KAIA transfer, Umrah Transportation, Saudi Arabia Chauffeur.
- Arabic mirror keywords bundled into `<meta name="keywords">` and body copy.

**JSON-LD stack now injected on `/` and `/en`, `/ar`**
1. `Organization` (global identity, sameAs socials, contactPoint).
2. `TaxiService` / `LocalBusiness` (address, geo, area served, hours, currency).
3. `WebSite` + `SearchAction` (site search wired to `/search?q=`).
4. `BreadcrumbList` (root breadcrumb).
5. `Service` × 2 — "Taxi from Jeddah Airport to Makkah" and "Umrah Transportation".
6. `FAQPage` — generated from the DB `faqs` collection (up to 12 items).
> `Organization`/`Website`/`ContactPoint`/`PostalAddress` live inside the graph via `organizationJsonLd()` and `localBusinessJsonLd()`.

**Canonical & hreflang** stay on the parent layout (`_public.{-$locale}.tsx`) — leaf no longer duplicates them, satisfying the earlier Lighthouse "relative URL" fix and preventing conflicting canonicals.

**Open Graph / Twitter** — per-locale og:image (`/og-home-ar.jpg`, `/og-home-en.jpg`), `og:locale:alternate`, `twitter:card=summary_large_image`, image dimensions + alt text.

## 2. Announcement Bar (replaces coupons banner concept)

**DB migration** — `coupons` extended with:
`is_announcement, title_ar/_en, description_ar/_en, cta_text_ar/_en, cta_url, bg_color, text_color, icon, priority, target_pages[], show_once, dismissible`.
Public RLS: anon + authenticated may `SELECT` only rows with `is_announcement=true AND is_active=true` inside the valid_from/valid_until window.

**Rendering** — `src/components/AnnouncementBar.tsx` sits above `PublicHeader` in the public layout. Selects the highest-priority announcement matching the current path (`target_pages` supports exact match and `/prefix/*`), applies custom colors and icon (`sparkles/tag/gift/plane/percent`), respects `dismissible` and `show_once` (persisted in `localStorage`).

**Admin UI** — `admin.coupons` rebuilt as two tabs:
- **Announcements**: bilingual title/description/CTA, color pickers, icon, priority, start/end datetime, target pages (comma-separated globs), show-once + dismissible toggles, active toggle, delete.
- **Coupons**: original discount-code manager preserved.

## 3. Verification

- `bunx tsgo --noEmit` → clean.
- Migration applied; only pre-existing SECURITY DEFINER warnings remain (unrelated).
- No duplicate canonical/hreflang after moving them to the layout.
