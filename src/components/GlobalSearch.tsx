import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { Users, IdCard, Car, CalendarCheck, ListChecks } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Row = { kind: "booking" | "customer" | "driver" | "vehicle" | "task"; id: string; title: string; subtitle?: string };

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { locale } = useI18n();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) { setQ(""); setRows([]); return; }
    const id = setTimeout(async () => {
      const term = q.trim();
      if (term.length < 2) { setRows([]); return; }
      setLoading(true);
      const like = `%${term}%`;
      const [bk, cu, dr, ve, tk] = await Promise.all([
        supabase.from("bookings").select("id, code, pickup_location, dropoff_location, status").or(`code.ilike.${like},pickup_location.ilike.${like},dropoff_location.ilike.${like}`).limit(6),
        supabase.from("customers").select("id, full_name, phone, email, company").or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like},company.ilike.${like}`).limit(6),
        supabase.from("drivers").select("id, full_name, phone, license_number").or(`full_name.ilike.${like},phone.ilike.${like},license_number.ilike.${like}`).limit(6),
        supabase.from("vehicles").select("id, plate_number, make, model, vin").or(`plate_number.ilike.${like},make.ilike.${like},model.ilike.${like},vin.ilike.${like}`).limit(6),
        (supabase.from as any)("tasks").select("id, title, status, priority").ilike("title", like).limit(6),
      ]);
      const out: Row[] = [];
      (bk.data ?? []).forEach((r: any) => out.push({ kind: "booking", id: r.id, title: r.code ?? r.id.slice(0, 8), subtitle: `${r.pickup_location ?? ""} → ${r.dropoff_location ?? ""} · ${r.status}` }));
      (cu.data ?? []).forEach((r: any) => out.push({ kind: "customer", id: r.id, title: r.full_name, subtitle: [r.phone, r.email, r.company].filter(Boolean).join(" · ") }));
      (dr.data ?? []).forEach((r: any) => out.push({ kind: "driver", id: r.id, title: r.full_name, subtitle: [r.phone, r.license_number].filter(Boolean).join(" · ") }));
      (ve.data ?? []).forEach((r: any) => out.push({ kind: "vehicle", id: r.id, title: r.plate_number ?? "—", subtitle: [r.make, r.model, r.vin].filter(Boolean).join(" · ") }));
      (tk.data ?? []).forEach((r: any) => out.push({ kind: "task", id: r.id, title: r.title, subtitle: `${r.status} · ${r.priority}` }));
      setRows(out);
      setLoading(false);
    }, 200);
    return () => clearTimeout(id);
  }, [q, open]);

  const go = (r: Row) => {
    onOpenChange(false);
    if (r.kind === "customer") navigate({ to: "/admin/customers/$id", params: { id: r.id } });
    else if (r.kind === "driver") navigate({ to: "/admin/drivers/$id", params: { id: r.id } });
    else if (r.kind === "vehicle") navigate({ to: "/admin/fleet/$id", params: { id: r.id } });
    else if (r.kind === "booking") navigate({ to: "/admin/bookings" });
    else if (r.kind === "task") navigate({ to: "/admin/tasks" });
  };

  const group = (kind: Row["kind"], label: string, Icon: any) => {
    const items = rows.filter((r) => r.kind === kind);
    if (!items.length) return null;
    return (
      <CommandGroup heading={label}>
        {items.map((r) => (
          <CommandItem key={`${kind}-${r.id}`} value={`${kind}-${r.id}-${r.title}`} onSelect={() => go(r)}>
            <Icon className="me-2 h-4 w-4 text-muted-foreground" />
            <div className="min-w-0">
              <div className="text-sm truncate">{r.title}</div>
              {r.subtitle && <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>}
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={locale === "ar" ? "بحث عن حجز، عميل، سائق، مركبة، مهمة…" : "Search bookings, customers, drivers, vehicles, tasks…"} value={q} onValueChange={setQ} />
      <CommandList>
        {q.length < 2
          ? <div className="py-8 text-center text-xs text-muted-foreground">{locale === "ar" ? "اكتب حرفين على الأقل" : "Type at least 2 characters"}</div>
          : loading
            ? <div className="py-8 text-center text-xs text-muted-foreground">{locale === "ar" ? "جاري البحث…" : "Searching…"}</div>
            : rows.length === 0
              ? <CommandEmpty>{locale === "ar" ? "لا توجد نتائج" : "No results"}</CommandEmpty>
              : (
                <>
                  {group("booking", locale === "ar" ? "حجوزات" : "Bookings", CalendarCheck)}
                  {group("customer", locale === "ar" ? "عملاء" : "Customers", Users)}
                  {group("driver", locale === "ar" ? "سائقون" : "Drivers", IdCard)}
                  {group("vehicle", locale === "ar" ? "مركبات" : "Vehicles", Car)}
                  <CommandSeparator />
                  {group("task", locale === "ar" ? "مهام" : "Tasks", ListChecks)}
                </>
              )}
      </CommandList>
    </CommandDialog>
  );
}
