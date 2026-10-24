# Notes for contributors and AI agents

- Stack: TanStack Start (SSR) + Nitro, MySQL/MariaDB via `mysql2`. No Supabase.
- The schema lives in `db/tables.mjs` (single source of truth). Add a column there, then re-run `npm run db:setup`
  against a fresh database, or `ALTER TABLE` an existing one by hand: setup only creates missing tables.
- Server-only code lives in `src/server/*.server.ts`; import it from server-function handlers with `await import(...)`.
- Admin (`/admin`) edits content through `src/lib/admin.functions.ts`; every function except login/me calls `requireAdmin()`.
  Which fields each form shows is described in `src/lib/admin-fields.ts`.
- Prices come from the `prices` table; `PRICING_DATA` in `src/lib/pricing.functions.ts` is only a fallback.
- A page or post is indexable only when its `seo_released` flag is on; sitemaps and robots meta use the same rule.
  The scheduler in `src/server/release.server.ts` flips the flag gradually (see docs/seo-checklist.md).
- Cleanup of content that must not return (cities the business does not serve) lives in `db/riyadh.mjs`, `db/unserved.mjs` and
  `db/migrations.mjs`; add new one-off data fixes as migrations, never as ad-hoc SQL.
- Build for Hostinger with `npm run build:node` and run with `npm start` (see docs/hostinger-deploy.md).
- The router uses the SSR query integration so server-loaded page data is reused in the browser; a failed client
  refetch must never replace rendered content (Google flagged that as Soft 404).
- robots.txt must keep `/_serverFn/` crawlable; Google needs those requests to render pages.
