import { createFileRoute } from "@tanstack/react-router";
import { CmsPageManager } from "@/components/cms/CmsPageManager";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/airports")({ component: AirportsAdmin });

function AirportsAdmin() {
  const { locale } = useI18n();
  return (
    <CmsPageManager
      pageType="airport"
      title={locale === "ar" ? "المطارات" : "Airports"}
      description={locale === "ar" ? "صفحات المطارات للسيو والحجز" : "Airport transfer landing pages."}
      publicPathPrefix="/airports"
      defaultSchemaType="Airport"
    />
  );
}
