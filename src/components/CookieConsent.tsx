import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const KEY = "cookie-consent-v1";

export function CookieConsent() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {}
  }, []);

  const set = (value: "all" | "essential") => {
    try { localStorage.setItem(KEY, value); } catch {}
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-2xl rounded-2xl border border-border bg-background/95 backdrop-blur-xl p-5 shadow-lift">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/20 text-gold">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg">{ar ? "نحن نستخدم ملفات تعريف الارتباط" : "We use cookies"}</div>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar
              ? "لتحسين تجربتك وتحليل الأداء. يمكنك قبول الكل أو الاكتفاء بالضروري."
              : "To improve your experience and analyze performance. Accept all or keep only essentials."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => set("all")} className="rounded-full">
              {ar ? "قبول الكل" : "Accept all"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => set("essential")} className="rounded-full">
              {ar ? "الضروري فقط" : "Essential only"}
            </Button>
            <Button size="sm" variant="ghost" asChild className="rounded-full">
              <a href="/privacy">{ar ? "سياسة الخصوصية" : "Privacy policy"}</a>
            </Button>
          </div>
        </div>
        <button aria-label="close" onClick={() => set("essential")} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
