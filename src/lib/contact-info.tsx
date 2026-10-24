// Live business-contact info (phone + WhatsApp) read from `public.settings`.
// Admins edit these from /admin/settings and every page — header, footer,
// floating buttons — updates without a rebuild. Falls back to SITE defaults
// while the query loads or if the DB row is missing.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const readValue = (row: any): string => {
  if (!row) return "";
  const v = row.value;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "value" in v) return String((v as any).value ?? "");
  return v == null ? "" : String(v);
};

export function ContactInfoProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<ContactInfo>(defaults);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("settings")
        .select("key,value")
        .in("key", ["contact_phone", "whatsapp_number", "whatsapp_default_message"]);
      if (cancelled || !data) return;
      const get = (k: string) => readValue(data.find((r: any) => r.key === k));
      const phone = get("contact_phone") || SITE.phone;
      const wa = digits(get("whatsapp_number") || SITE.whatsapp);
      const msg = get("whatsapp_default_message");
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

    // Realtime: reflect admin edits everywhere without reload.
    const channel = supabase
      .channel("settings-contact-info")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => { void load(); })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  return <Ctx.Provider value={info}>{children}</Ctx.Provider>;
}

export function useContactInfo(): ContactInfo {
  return useContext(Ctx);
}
