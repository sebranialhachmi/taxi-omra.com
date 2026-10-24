import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { adminLogout, adminMe } from "@/lib/admin.functions";
import { TABLE_CONFIG } from "@/lib/admin-fields";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "لوحة التحكم" }, { name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: async ({ location }) => {
    const me = await adminMe();
    const onLogin = location.pathname.replace(/\/+$/, "") === "/admin/login";
    if (!me && !onLogin) throw redirect({ to: "/admin/login" });
    return { me };
  },
  component: AdminLayout,
});

const NAV: Array<{ to: string; label: string; params?: Record<string, string> }> = [
  { to: "/admin", label: "الرئيسية" },
  { to: "/admin/c/$table", params: { table: "prices" }, label: TABLE_CONFIG.prices.label },
  { to: "/admin/c/$table", params: { table: "pages" }, label: TABLE_CONFIG.pages.label },
  { to: "/admin/c/$table", params: { table: "posts" }, label: TABLE_CONFIG.posts.label },
  { to: "/admin/c/$table", params: { table: "faqs" }, label: TABLE_CONFIG.faqs.label },
  { to: "/admin/c/$table", params: { table: "fleet" }, label: TABLE_CONFIG.fleet.label },
  { to: "/admin/c/$table", params: { table: "hero_slides" }, label: TABLE_CONFIG.hero_slides.label },
  { to: "/admin/c/$table", params: { table: "homepage_sections" }, label: TABLE_CONFIG.homepage_sections.label },
  { to: "/admin/c/$table", params: { table: "testimonials" }, label: TABLE_CONFIG.testimonials.label },
  { to: "/admin/c/$table", params: { table: "blog_categories" }, label: TABLE_CONFIG.blog_categories.label },
  { to: "/admin/c/$table", params: { table: "redirects" }, label: TABLE_CONFIG.redirects.label },
  { to: "/admin/release", label: "جدول النشر" },
  { to: "/admin/messages", label: "الرسائل" },
  { to: "/admin/settings", label: "الإعدادات" },
];

function AdminLayout() {
  const { me } = Route.useRouteContext();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!me) return <div dir="rtl" className="min-h-screen bg-muted/30"><Outlet /></div>;
  return (
    <div dir="rtl" className="min-h-screen bg-muted/30 md:flex">
      <aside className="border-b bg-background p-3 md:min-h-screen md:w-60 md:border-b-0 md:border-l">
        <div className="mb-3 px-2 text-lg font-semibold">لوحة التحكم</div>
        <nav className="flex flex-wrap gap-1 md:flex-col">
          {NAV.map((n) => {
            const active = n.to === "/admin" ? path === "/admin" : path.startsWith(n.params ? `/admin/c/${n.params.table}` : n.to);
            return (
              <Link key={n.label} to={n.to as any} params={n.params as any}
                className={`rounded-md px-3 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 space-y-2 border-t px-2 pt-3 text-xs text-muted-foreground">
          <div dir="ltr" className="truncate">{me.email}</div>
          <Button size="sm" variant="outline" onClick={async () => { await adminLogout(); navigate({ to: "/admin/login" }); }}>تسجيل الخروج</Button>
          <a href="/" className="block underline" target="_blank" rel="noreferrer">فتح الموقع</a>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6"><Outlet /></main>
    </div>
  );
}
