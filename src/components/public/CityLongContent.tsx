import cityPages from "@/data/city-pages.json";
import { sanitizeHtml } from "@/lib/html";
import { useI18n } from "@/lib/i18n";

type CityPagesData = Record<string, { ar?: string | null; en?: string | null }>;

const DATA = cityPages as CityPagesData;

export function CityLongContent({ page }: { page: string }) {
  const { locale } = useI18n();
  const entry = DATA[page];
  const html = entry ? (locale === "ar" ? entry.ar : entry.en) : null;
  if (!html) return null;

  return (
    <section
      className="article-content mb-16 max-w-none"
      dir={locale === "ar" ? "rtl" : "ltr"}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

export default CityLongContent;
