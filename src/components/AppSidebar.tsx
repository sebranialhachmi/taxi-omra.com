import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, CalendarCheck, Users, IdCard, Car, Layers, Route as RouteIcon,
  DollarSign, TicketPercent, CreditCard, Bell, BarChart3, UserCog, ShieldCheck, Settings, ScrollText,
  FileText, HelpCircle, Newspaper, Globe, Radio, Wrench, GaugeCircle,
  PieChart, Receipt, Building2, Undo2, Wallet, Briefcase,
  Sparkles, Image as ImageIcon2, Megaphone, Handshake, Inbox, LayoutTemplate,
  MessageCircle, Activity, AlertTriangle, DatabaseBackup,
  Building, Plane, MapPin, ConciergeBell, Quote, UsersRound, ListTree,
  Search, ArrowRightLeft, Wand2, CalendarDays, ListChecks, BellRing,
} from "lucide-react";

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

export function AppSidebar() {
  const { t, locale } = useI18n();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => path === p || path.startsWith(p + "/");

  const groups: { label: string; items: { title: string; url: string; icon: any; external?: boolean }[] }[] = [
    { label: t("overview"), items: [{ title: t("dashboard"), url: "/admin/dashboard", icon: LayoutDashboard }] },
    { label: t("operations"), items: [
      { title: t("bookings"), url: "/admin/bookings", icon: CalendarCheck },
      { title: locale === "ar" ? "مركز الإرسال" : "Dispatch", url: "/admin/dispatch", icon: Radio },
      { title: locale === "ar" ? "التقويم" : "Calendar", url: "/admin/calendar", icon: CalendarDays },
      { title: locale === "ar" ? "المهام" : "Tasks", url: "/admin/tasks", icon: ListChecks },
      { title: locale === "ar" ? "التنبيهات" : "Reminders", url: "/admin/reminders", icon: BellRing },
      
      { title: t("drivers"), url: "/admin/drivers", icon: IdCard },
    ]},
    { label: t("catalog"), items: [
      { title: locale === "ar" ? "لوحة الأسطول" : "Fleet Dashboard", url: "/admin/fleet-dashboard", icon: GaugeCircle },
      { title: t("fleet"), url: "/admin/fleet", icon: Car },
      { title: locale === "ar" ? "الصيانة" : "Maintenance", url: "/admin/maintenance", icon: Wrench },
      
      { title: t("routes"), url: "/admin/routes", icon: RouteIcon },
    ]},
    { label: t("finance"), items: [
      { title: locale === "ar" ? "لوحة المالية" : "Finance Overview", url: "/admin/finance", icon: PieChart },
      { title: t("payments"), url: "/admin/payments", icon: CreditCard },
      { title: locale === "ar" ? "الفواتير" : "Invoices", url: "/admin/invoices", icon: Receipt },
      { title: locale === "ar" ? "المصروفات" : "Expenses", url: "/admin/expenses", icon: Wallet },
      { title: locale === "ar" ? "المرتجعات" : "Refunds", url: "/admin/refunds", icon: Undo2 },
      { title: locale === "ar" ? "الحسابات المؤسسية" : "Corporate", url: "/admin/corporate", icon: Building2 },
      { title: locale === "ar" ? "الرواتب" : "Payroll", url: "/admin/payroll", icon: Briefcase },
      
      { title: t("coupons"), url: "/admin/coupons", icon: TicketPercent },
      { title: locale === "ar" ? "إعدادات المالية" : "Finance Settings", url: "/admin/finance-settings", icon: Settings },
    ]},
    { label: locale === "ar" ? "إدارة المحتوى" : "CMS", items: [
      { title: locale === "ar" ? "الخدمات" : "Services", url: "/admin/services", icon: ConciergeBell },
      { title: locale === "ar" ? "المدن" : "Cities", url: "/admin/cities", icon: Building },
      { title: locale === "ar" ? "المطارات" : "Airports", url: "/admin/airports", icon: Plane },
      { title: locale === "ar" ? "صفحات المسارات" : "Route Pages", url: "/admin/route-pages", icon: MapPin },
      { title: locale === "ar" ? "الصفحات الثابتة" : "Static Pages", url: "/admin/pages", icon: FileText },
      { title: locale === "ar" ? "القوائم" : "Menus", url: "/admin/menus", icon: ListTree },
      { title: locale === "ar" ? "الشهادات" : "Testimonials", url: "/admin/testimonials", icon: Quote },
      { title: locale === "ar" ? "الفريق" : "Team", url: "/admin/team", icon: UsersRound },
      { title: locale === "ar" ? "المدونة" : "Blog", url: "/admin/blog", icon: Newspaper },
      { title: locale === "ar" ? "الأسئلة الشائعة" : "FAQ", url: "/admin/faqs", icon: HelpCircle },
      { title: locale === "ar" ? "مكتبة الوسائط" : "Media Library", url: "/admin/media", icon: ImageIcon2 },
      { title: locale === "ar" ? "معاينة الموقع" : "Preview site", url: "/", icon: Globe, external: true },
    ]},
    { label: locale === "ar" ? "تحسين محركات البحث" : "SEO", items: [
      { title: locale === "ar" ? "مدير السيو" : "SEO Manager", url: "/admin/seo", icon: Search },
      { title: locale === "ar" ? "التوجيهات" : "Redirects", url: "/admin/redirects", icon: ArrowRightLeft },
      { title: locale === "ar" ? "مولد الصفحات" : "Programmatic Generator", url: "/admin/seo-generator", icon: Wand2 },
    ]},
    { label: locale === "ar" ? "التسويق" : "Marketing", items: [
      { title: locale === "ar" ? "الصفحة الرئيسية" : "Homepage", url: "/admin/homepage", icon: LayoutTemplate },
      { title: locale === "ar" ? "شرائح الهيرو" : "Hero Slides", url: "/admin/hero", icon: Sparkles },
      { title: locale === "ar" ? "العروض الترويجية" : "Promotions", url: "/admin/promotions", icon: Megaphone },
      { title: locale === "ar" ? "الشركاء" : "Partners", url: "/admin/partners", icon: Handshake },
      { title: locale === "ar" ? "صندوق التواصل" : "Contact Inbox", url: "/admin/contacts", icon: Inbox },
    ]},

    { label: locale === "ar" ? "الاتصالات" : "Communications", items: [
      { title: locale === "ar" ? "قوالب واتساب" : "WhatsApp Templates", url: "/admin/whatsapp-templates", icon: MessageCircle },
      { title: locale === "ar" ? "قائمة الإشعارات" : "Notification Queue", url: "/admin/notification-queue", icon: BellRing },
    ]},
    { label: t("system"), items: [
      { title: t("notifications"), url: "/admin/notifications", icon: Bell },
      { title: t("reports"), url: "/admin/reports", icon: BarChart3 },
      { title: locale === "ar" ? "التحليلات" : "Analytics", url: "/admin/analytics", icon: PieChart },
      { title: locale === "ar" ? "العمليات" : "Operations", url: "/admin/operations", icon: Activity },
      { title: locale === "ar" ? "سجلات الأخطاء" : "Error Logs", url: "/admin/errors", icon: AlertTriangle },
      { title: locale === "ar" ? "النسخ الاحتياطي" : "Backup", url: "/admin/backup", icon: DatabaseBackup },
      { title: t("users"), url: "/admin/users", icon: UserCog },
      { title: t("roles"), url: "/admin/roles", icon: ShieldCheck },
      { title: t("settings"), url: "/admin/settings", icon: Settings },
      { title: t("audit"), url: "/admin/audit", icon: ScrollText },
    ]},
  ];

  return (
    <Sidebar collapsible="icon" side={locale === "ar" ? "right" : "left"} className="border-e border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <div className="flex items-center gap-3 px-1 py-3">
          <img
            src={SITE.logo}
            alt={SITE.brand[locale]}
            className={collapsed ? "h-8 w-8 object-contain shrink-0" : "h-10 w-auto object-contain shrink-0"}
            width={collapsed ? 32 : 96}
            height={collapsed ? 32 : 54}
          />
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-display text-base truncate">{SITE.brand[locale]}</span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/60">{t("admin_panel")}</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel className="text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/50 font-semibold px-3">{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-gold data-[active=true]:font-medium hover:bg-sidebar-accent/60 rounded-lg h-9"
                      >
                        {item.external ? (
                          <a href={item.url} target="_blank" rel="noopener" className="flex items-center gap-2.5 relative">
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="text-sm">{item.title}</span>}
                          </a>
                        ) : (
                          <Link to={item.url as any} className="flex items-center gap-2.5 relative">
                            {active && <span className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-gold" />}
                            <item.icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="text-sm">{item.title}</span>}
                          </Link>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
