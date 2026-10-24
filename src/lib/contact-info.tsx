// Live business-contact info (phone + WhatsApp) read from `public.settings`.
// Admins edit these from /admin/settings and every page — header, footer,
// floating buttons — updates without a rebuild. Falls back to SITE defaults
// while the query loads or if the DB row is missing.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getPublicSettings } from "@/lib/public.functions";
import { SITE } from "@/lib/site-info";

type ContactInfo = {
  /** Display phone, e.g. "+966551796487" */
  phone: string;
  /** Digits only, E.164 without "+", e.g. "966551796487" */
  whatsapp: string;
  /** Default prefilled WhatsApp message */
  whatsappMessage: string;
  /** tel: href */
  telHref: string;
  /** wa.me href with default message */
  waHref: (text?: string) => string;
};

const digits = (v: string) => v.replace(/[^\d]/g, "");

const defaults: ContactInfo = {
  phone: SITE.phone,
  whatsapp: SITE.whatsapp,
  whatsappMessage: "",
  telHref: `tel:${SITE.phone}`,
  waHref: (text?: string) =>
    `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`,
};

const Ctx = createContext<ContactInfo>(defaults);

export function ContactInfoProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<ContactInfo>(defaults);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const data = await getPublicSettings().catch(() => null);
      if (cancelled || !data) return;
      const phone = data.contact_phone || SITE.phone;
      const wa = digits(data.whatsapp_number || SITE.whatsapp);
      const msg = data.whatsapp_default_message;
      setInfo({
        phone,
        whatsapp: wa,
        whatsappMessage: msg,
        telHref: `tel:${phone}`,
        waHref: (text?: string) => {
          const t = text ?? msg;
          return `https://wa.me/${wa}${t ? `?text=${encodeURIComponent(t)}` : ""}`;
        },
      });
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  return <Ctx.Provider value={info}>{children}</Ctx.Provider>;
}

export function useContactInfo(): ContactInfo {
  return useContext(Ctx);
}
