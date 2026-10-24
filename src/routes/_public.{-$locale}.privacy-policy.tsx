// /privacy-policy → alias of /privacy (PAGES.md spec URL).
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE, withLocale, isLocale, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/_public/{-$locale}/privacy-policy")({
  beforeLoad: ({ params }) => {
    const locale = (isLocale(params.locale) ? params.locale : DEFAULT_LOCALE) as Locale;
    throw redirect({ href: withLocale(locale, "/privacy"), replace: true });
  },
});
