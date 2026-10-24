import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Phone, MessageCircle, Languages, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { SITE } from "@/lib/site-info";
import { useContactInfo } from "@/lib/contact-info";

import { cn } from "@/lib/utils";

export function PublicHeader() {
  const { locale, setLocale, t } = useI18n();
  const { theme, toggle } = useTheme();
  const { phone, telHref, waHref } = useContactInfo();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const otherLocale = locale === "ar" ? "en" : "ar";
  // Compute the "same page in the other language" URL for the language switch.
  const langSwitchHref = (() => {
    const seg = pathname.split("/").filter(Boolean)[0];
    const rest = seg === "ar" || seg === "en" ? pathname.slice(3) || "/" : pathname || "/";
    return `/${otherLocale}${rest === "/" ? "" : rest}`;
  })();

  const nav: Array<{ path: string; label: string }> = [
    { path: "", label: locale === "ar" ? "الرئيسية" : "Home" },
    { path: "/services", label: locale === "ar" ? "الخدمات" : "Services" },
    { path: "/fleet", label: locale === "ar" ? "الأسطول" : "Fleet" },
    
    { path: "/blog", label: locale === "ar" ? "المدونة" : "Journal" },
    { path: "/about", label: locale === "ar" ? "من نحن" : "About" },
    { path: "/contact", label: locale === "ar" ? "تواصل" : "Contact" },
  ];

  const localized = (p: string) => `/${locale}${p}`;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-elegant"
          : "bg-transparent"
      )}
    >
      <div className="container-tight flex h-20 items-center justify-between gap-4">
        <Link to={localized("")} className="flex items-center gap-3 group" aria-label={SITE.brand[locale]}>
          <img
            src={SITE.logo}
            alt={SITE.brand[locale]}
            className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            width={110}
            height={60}
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display text-lg tracking-tight">{SITE.brand[locale]}</span>
            <span className="text-[11px] tracking-[0.02em] text-muted-foreground" dir="rtl">تاكسي من مطار جدة إلى مكة المكرمة</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
          {nav.map((n) => (
            <Link
              key={n.path || "home"}
              to={localized(n.path)}
              className="relative px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "relative px-3 py-2 text-sm font-semibold text-foreground" }}
              activeOptions={{ exact: n.path === "" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            asChild
            variant="ghost"
            size="sm"
            aria-label={otherLocale === "en" ? "Switch to English" : "التبديل للعربية"}
            className="rounded-full gap-1.5"
            onClick={() => {
              try { window.localStorage.setItem("locale", otherLocale); } catch {}
            }}
          >
            <Link to={langSwitchHref} hrefLang={otherLocale} rel="alternate">
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline text-[10px] font-semibold uppercase leading-tight whitespace-pre-line text-start">
                {otherLocale === "en" ? "English" : "العربية"}
              </span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex rounded-full">
            <a href={telHref} aria-label={locale === "ar" ? "اتصل بنا" : "Call us"}>
              <Phone className="h-4 w-4 me-2" /> {phone}
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="hidden md:inline-flex rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant"
          >
            <a href={waHref()} target="_blank" rel="noopener">
              <MessageCircle className="h-4 w-4 me-2" /> {locale === "ar" ? "احجز الآن" : "Book now"}
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden rounded-full" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl animate-fade-in">
          <nav className="container-tight flex flex-col py-4 gap-1" aria-label="Primary mobile">
            {nav.map((n) => (
              <Link
                key={n.path || "home"}
                to={localized(n.path)}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to={langSwitchHref}
              onClick={() => { 
                try { window.localStorage.setItem("locale", otherLocale); } catch {} 
                setOpen(false); 
              }}
              className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted flex items-center gap-2"
              hrefLang={otherLocale}
              rel="alternate"
            >
              <Languages className="h-4 w-4" /> {otherLocale === "en" ? "English" : "العربية"}
            </Link>
            <div className="flex gap-2 mt-3">
              <Button asChild variant="outline" className="flex-1 rounded-full">
                <a href={telHref}><Phone className="h-4 w-4 me-2" /> {locale === "ar" ? "اتصل" : "Call"}</a>
              </Button>
              <Button asChild className="flex-1 rounded-full bg-primary text-primary-foreground">
                <a href={waHref()} target="_blank" rel="noopener"><MessageCircle className="h-4 w-4 me-2" /> WhatsApp</a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
