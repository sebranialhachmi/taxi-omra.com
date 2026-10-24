import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Moon, Sun, Languages, LogOut, Bell, Search, ExternalLink } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";

export function Topbar() {
  const { t, locale, setLocale } = useI18n();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <button
        onClick={() => setSearchOpen(true)}
        className="relative hidden md:flex items-center gap-2 flex-1 max-w-md h-9 rounded-full bg-muted/50 border border-transparent hover:border-border px-3 text-sm text-muted-foreground transition"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-start">{locale === "ar" ? "بحث سريع…" : "Quick search…"}</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <div className="flex-1 md:hidden" />
      <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex rounded-full text-muted-foreground">
        <a href="/" target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 me-2" />{locale === "ar" ? "الموقع" : "View site"}</a>
      </Button>
      <Button variant="ghost" size="icon" onClick={() => setLocale(locale === "ar" ? "en" : "ar")} title={t("toggle_lang")} className="rounded-full">
        <Languages className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={toggle} className="rounded-full" aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 end-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8 ring-2 ring-gold/40">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{(user?.email?.[0] ?? "?").toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}>
            <LogOut className="me-2 h-4 w-4" /> {t("signout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
