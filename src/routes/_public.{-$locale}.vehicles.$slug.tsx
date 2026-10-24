// /vehicles/$slug alias → canonical /fleet/$slug (PAGES.md spec URL).
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE, withLocale, isLocale, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/_public/{-$locale}/vehicles/$slug")({
  beforeLoad: ({ params }) => {
    const locale = (isLocale(params.locale) ? params.locale : DEFAULT_LOCALE) as Locale;
    throw redirect({ href: withLocale(locale, `/fleet/${params.slug}`), replace: true });
  },
});
