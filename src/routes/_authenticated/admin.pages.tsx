import { createFileRoute } from "@tanstack/react-router";
import { CmsPageManager } from "@/components/cms/CmsPageManager";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/pages")({ component: PagesAdmin });

function PagesAdmin() {
  const { locale } = useI18n();
  return (
    <CmsPageManager
      pageType="generic"
      title={locale === "ar" ? "الصفحات الثابتة" : "Static Pages"}
      description={locale === "ar" ? "صفحات ثابتة مثل من نحن، الشروط، الخصوصية" : "Static pages such as About, Terms, Privacy."}
      publicPathPrefix="/p"
    />
  );
}
