// Sticky floating action buttons: WhatsApp (primary) + Phone (secondary).
// Number + default message come from useContactInfo (DB settings) so admins
// can change them from /admin/settings and every page — including this FAB —
// updates instantly via realtime.
import { MessageCircle, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useContactInfo } from "@/lib/contact-info";

export function WhatsAppFab() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { phone, telHref, waHref, whatsappMessage } = useContactInfo();
  const fallbackMsg = ar ? "أرغب بحجز تاكسي" : "I'd like to book a chauffeur";
  const href = waHref(whatsappMessage || fallbackMsg);

  return (
    <div
      className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-3"
      role="group"
      aria-label={ar ? "أزرار الحجز السريع" : "Quick booking actions"}
    >
      <a
        href={telHref}
        aria-label={ar ? `اتصل بنا ${phone}` : `Call us ${phone}`}
        className="group inline-flex items-center gap-2 rounded-full bg-background text-foreground pe-5 ps-2 py-2 shadow-lift ring-1 ring-gold/50 hover:ring-gold transition-all hover:-translate-y-0.5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-primary">
          <Phone className="h-5 w-5" />
        </span>
        <span className="hidden sm:inline text-sm font-medium">
          {ar ? "اتصل الآن" : "Call now"}
        </span>
      </a>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        aria-label={ar ? "احجز عبر واتساب" : "Book via WhatsApp"}
        className="group inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground pe-5 ps-2 py-2 shadow-lift ring-1 ring-gold/40 hover:ring-gold transition-all hover:-translate-y-0.5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-primary">
          <MessageCircle className="h-5 w-5" />
        </span>
        <span className="hidden sm:inline text-sm font-medium">
          {ar ? "احجز عبر واتساب" : "Book via WhatsApp"}
        </span>
      </a>
    </div>
  );
}

