// /vehicles alias — spec uses both /fleet and /vehicles terminology.
// Preserve the semantic URL and redirect to the canonical /fleet page.
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE, withLocale, isLocale, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/_public/{-$locale}/vehicles")({
  beforeLoad: ({ params }) => {
    const locale = (isLocale(params.locale) ? params.locale : DEFAULT_LOCALE) as Locale;
    throw redirect({ href: withLocale(locale, "/fleet"), replace: true });
  },
});
