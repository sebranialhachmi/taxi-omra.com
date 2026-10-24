import { createFileRoute } from "@tanstack/react-router";
import { CmsPageManager } from "@/components/cms/CmsPageManager";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/route-pages")({ component: RoutePagesAdmin });

function RoutePagesAdmin() {
  const { locale } = useI18n();
  return (
    <CmsPageManager
      pageType="route_page"
      title={locale === "ar" ? "صفحات المسارات" : "Route Pages"}
      description={locale === "ar" ? "صفحات المسارات (من — إلى) للسيو البرمجي" : "Programmatic SEO pages for point-to-point routes."}
      publicPathPrefix="/routes"
      defaultSchemaType="Service"
    />
  );
}
