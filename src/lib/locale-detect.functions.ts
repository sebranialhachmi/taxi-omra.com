import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

/**
 * Locale fallback for legacy call sites. Root/public routes must always use
 * Arabic as the default and never infer English from request headers.
 */
export const resolveLocale = createServerFn({ method: "GET" }).handler(async (): Promise<Locale> => {
  return DEFAULT_LOCALE;
});
