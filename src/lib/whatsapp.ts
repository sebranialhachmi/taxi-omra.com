// WhatsApp template rendering + click-to-chat link builder.
// Customers do not register; WhatsApp is the primary channel — every send
// opens the operator's WhatsApp with a pre-filled message so staff review before it goes out.

import { SITE } from "@/lib/site-info";

export type WATemplate = {
  code: string;
  name: string;
  category: string;
  body_en: string;
  body_ar: string;
  variables: string[];
  is_active: boolean;
};

export function renderTemplate(body: string, vars: Record<string, string | number | null | undefined>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v === null || v === undefined ? "" : String(v);
  });
}

function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return String(SITE.whatsapp);
  return raw.replace(/[^0-9]/g, "");
}

/** Build a wa.me deep link. Recipient phone must be MSISDN (digits, country code, no +). */
export function waLinkTo(phone: string | null | undefined, message: string): string {
  const p = normalizePhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}

/** Pick body per locale, render vars, and open in a new tab. */
export function openWhatsApp(opts: {
  phone: string | null | undefined;
  template: Pick<WATemplate, "body_en" | "body_ar">;
  vars: Record<string, string | number | null | undefined>;
  locale: "en" | "ar";
}) {
  const body = opts.locale === "ar" ? opts.template.body_ar : opts.template.body_en;
  const text = renderTemplate(body, opts.vars);
  const url = waLinkTo(opts.phone, text);
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener");
  return url;
}
