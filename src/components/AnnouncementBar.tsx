// Sticky site-wide announcement bar rendered above the public header.
// Data source: coupons rows with is_announcement=true (RLS filters to active+in-window).
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X, Sparkles, Tag, Gift, Plane, Percent } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { listAnnouncements } from "@/lib/public.functions";

const ICONS: Record<string, any> = { sparkles: Sparkles, tag: Tag, gift: Gift, plane: Plane, percent: Percent };

function matchesPath(target: string[] | null | undefined, pathname: string): boolean {
  if (!target || target.length === 0) return true; // empty = all pages
  const localeLess = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  return target.some((p) => {
    const pat = p.trim();
    if (!pat) return false;
    if (pat === "/") return localeLess === "/";
    if (pat.endsWith("*")) return localeLess.startsWith(pat.slice(0, -1));
    return localeLess === pat;
  });
}

export function AnnouncementBar() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ["public", "announcements"],
    queryFn: () => listAnnouncements(),
    staleTime: 60_000,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("dismissed_announcements") || "[]";
      setDismissed(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const active = useMemo(() => {
    const rows = (data ?? []).filter((r: any) => matchesPath(r.target_pages, pathname));
    return rows.find((r: any) => !(r.show_once && dismissed.has(r.id))) ?? null;
  }, [data, pathname, dismissed]);

  if (!active) return null;

  const title = ar ? active.title_ar || active.title_en : active.title_en || active.title_ar;
  const desc = ar ? active.description_ar || active.description_en : active.description_en || active.description_ar;
  const cta = ar ? active.cta_text_ar || active.cta_text_en : active.cta_text_en || active.cta_text_ar;
  const Icon = ICONS[String(active.icon || "").toLowerCase()] || Sparkles;
  const bg = active.bg_color || "hsl(var(--primary))";
  const fg = active.text_color || "hsl(var(--primary-foreground))";

  const close = () => {
    const next = new Set(dismissed);
    next.add(active.id);
    setDismissed(next);
    try { window.localStorage.setItem("dismissed_announcements", JSON.stringify([...next])); } catch {}
  };

  return (
    <div
      role="region"
      aria-label={ar ? "شريط الإعلانات" : "Announcement"}
      className="w-full text-sm"
      style={{ backgroundColor: bg, color: fg }}
    >
      <div className="container-tight flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 px-3 text-center">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-medium">{title}</span>
        {desc ? <span className="opacity-85 hidden sm:inline">— {desc}</span> : null}
        {active.cta_url && cta ? (
          <a
            href={active.cta_url}
            className="underline underline-offset-4 font-semibold hover:opacity-90"
            {...(active.cta_url.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
          >
            {cta} →
          </a>
        ) : null}
        {active.dismissible !== false ? (
          <button
            type="button"
            onClick={close}
            aria-label={ar ? "إغلاق" : "Close"}
            className="ms-auto inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
