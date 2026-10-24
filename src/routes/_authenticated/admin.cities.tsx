import { createFileRoute } from "@tanstack/react-router";
import { CmsPageManager } from "@/components/cms/CmsPageManager";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/cities")({ component: CitiesAdmin });

function CitiesAdmin() {
  const { locale } = useI18n();
  return (
    <CmsPageManager
      pageType="city"
      title={locale === "ar" ? "المدن" : "Cities"}
      description={locale === "ar" ? "صفحات المدن للسيو" : "City landing pages for programmatic SEO."}
      publicPathPrefix="/cities"
      defaultSchemaType="Place"
    />
  );
}
