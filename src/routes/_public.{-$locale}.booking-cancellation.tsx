// /booking-cancellation → alias of /cancellation (PAGES.md spec URL).
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE, withLocale, isLocale, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/_public/{-$locale}/booking-cancellation")({
  beforeLoad: ({ params }) => {
    const locale = (isLocale(params.locale) ? params.locale : DEFAULT_LOCALE) as Locale;
    throw redirect({ href: withLocale(locale, "/cancellation"), replace: true });
  },
});
