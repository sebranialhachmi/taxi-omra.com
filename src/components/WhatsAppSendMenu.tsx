import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { openWhatsApp, renderTemplate, type WATemplate } from "@/lib/whatsapp";
import { useI18n } from "@/lib/i18n";
import { useServerFn } from "@tanstack/react-start";
import { logWhatsAppMessage } from "@/lib/booking-ops.functions";

/**
 * One-click WhatsApp send for a booking / customer / contact. Loads templates
 * from DB, renders against the context, opens WhatsApp with the message
 * pre-filled, and logs the send to `whatsapp_messages` for CRM history.
 */
export function WhatsAppSendMenu({
  phone,
  vars,
  size = "sm",
  variant = "outline",
  bookingId = null,
  customerId = null,
  contactId = null,
}: {
  phone: string | null | undefined;
  vars: Record<string, string | number | null | undefined>;
  size?: "sm" | "default" | "icon";
  variant?: "outline" | "default" | "ghost";
  bookingId?: string | null;
  customerId?: string | null;
  contactId?: string | null;
}) {
  const { locale } = useI18n();
  const log = useServerFn(logWhatsAppMessage);
  const q = useQuery({
    queryKey: ["wa-templates-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("whatsapp_templates")
        .select("code,name,category,body_en,body_ar,variables,is_active")
        .eq("is_active", true)
        .order("sort_order");
      return (data ?? []) as WATemplate[];
    },
    staleTime: 60_000,
  });

  const send = (t: WATemplate) => {
    openWhatsApp({ phone, template: t, vars, locale });
    const body = renderTemplate(locale === "ar" ? t.body_ar : t.body_en, vars);
    log({ data: { phone: phone ?? "", body, locale, template_code: t.code, booking_id: bookingId, customer_id: customerId, contact_id: contactId } }).catch(() => {});
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} className="gap-2" disabled={!phone}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{locale === "ar" ? "قالب رسالة" : "Send template"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(q.data ?? []).map((t) => (
          <DropdownMenuItem key={t.code} onSelect={() => send(t)}>
            <div className="flex flex-col">
              <span className="text-sm">{t.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.category}</span>
            </div>
          </DropdownMenuItem>
        ))}
        {(q.data ?? []).length === 0 && (
          <DropdownMenuItem disabled>No active templates</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

