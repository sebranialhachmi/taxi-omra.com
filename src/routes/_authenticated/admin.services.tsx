import { createFileRoute } from "@tanstack/react-router";
import { CmsPageManager } from "@/components/cms/CmsPageManager";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/services")({ component: ServicesAdmin });

function ServicesAdmin() {
  const { locale } = useI18n();
  return (
    <CmsPageManager
      pageType="service"
      title={locale === "ar" ? "الخدمات" : "Services"}
      description={locale === "ar" ? "صفحات الخدمات المقدمة" : "Service pages surfaced on the public site."}
      publicPathPrefix="/services"
      defaultSchemaType="Service"
    />
  );
}
