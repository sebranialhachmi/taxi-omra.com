import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Phone, MessageCircle, Mail, Building2, MapPin, FileText, Upload, Download, Trash2, Pin, PinOff, Save, Star, TrendingUp, Wallet, Repeat, CalendarDays, Plus, X } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { CustomerTierBadge } from "@/components/CustomerTierBadge";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { UnifiedBookingDialog } from "@/components/admin/UnifiedBookingDialog";

export const Route = createFileRoute("/_authenticated/admin/customers/$id")({ component: CustomerProfilePage });

const NOTE_KINDS = ["note", "call", "whatsapp", "email", "complaint", "payment", "refund"] as const;
const NOTE_KIND_LABEL: Record<string,string> = { note: "Note", call: "Call", whatsapp: "WhatsApp", email: "Email", complaint: "Complaint", payment: "Payment", refund: "Refund" };

function CustomerProfilePage() {
  const { id } = Route.useParams();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newBookingOpen, setNewBookingOpen] = useState(false);

  const q = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const bookings = useQuery({
    queryKey: ["customer-bookings", id],
    queryFn: async () => (await supabase.from("bookings").select("id, code, status, total_fare, pickup_location, dropoff_location, pickup_at, created_at, driver:drivers(full_name), category:vehicle_categories(code)").eq("customer_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  const payments = useQuery({
    queryKey: ["customer-payments", id],
    queryFn: async () => (await supabase.from("payments").select("id, amount, status, method, created_at, booking:bookings!inner(id, code, customer_id)").eq("booking.customer_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  if (q.isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="p-8"><Button variant="outline" onClick={() => navigate({ to: "/admin/bookings" })}><ArrowLeft className="h-4 w-4 me-2" />Back</Button><div className="mt-4">Customer not found</div></div>;

  const c = q.data;
  const daysSince = c.last_booking_at ? Math.floor((Date.now() - new Date(c.last_booking_at).getTime()) / 86400_000) : null;
  const bList = bookings.data ?? [];
  const upcoming = bList.filter((b: any) => b.pickup_at && new Date(b.pickup_at) > new Date() && !["completed","cancelled","no_show"].includes(b.status));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link to="/admin/bookings"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-1" />Bookings</Button></Link>
      </div>

      <PageHeader
        eyebrow="Customer profile"
        title={c.full_name}
        description={c.company ? `${c.company}${c.vat_number ? " · VAT " + c.vat_number : ""}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <CustomerTierBadge value={c.tier} />
            <Button size="sm" onClick={() => setNewBookingOpen(true)}><Plus className="h-4 w-4 me-1" />{locale === "ar" ? "حجز جديد" : "New booking"}</Button>
            <EditCustomerDialog customer={c} onSaved={() => qc.invalidateQueries({ queryKey: ["customer", id] })} />
          </div>
        }
      />
      <UnifiedBookingDialog
        open={newBookingOpen}
        onOpenChange={setNewBookingOpen}
        initialCustomer={{ id: c.id, full_name: c.full_name, phone: c.phone, whatsapp: c.whatsapp, email: c.email }}
        onCreated={() => { qc.invalidateQueries({ queryKey: ["customer-bookings", id] }); qc.invalidateQueries({ queryKey: ["customer", id] }); }}
      />

      {/* Contact strip */}
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <ContactItem icon={Phone} label="Phone" value={c.phone} href={c.phone ? `tel:${c.phone}` : undefined} />
        <ContactItem icon={MessageCircle} label="WhatsApp" value={c.whatsapp} href={c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/\D/g,"")}` : undefined} />
        <ContactItem icon={Mail} label="Email" value={c.email} href={c.email ? `mailto:${c.email}` : undefined} />
        <ContactItem icon={MapPin} label="Location" value={[c.city, c.country].filter(Boolean).join(", ") || null} />
      </div>

      {/* Tags */}
      <TagEditor customerId={c.id} tags={c.tags ?? []} onChange={() => qc.invalidateQueries({ queryKey: ["customer", id] })} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mt-6">
        <StatCard label="Lifetime revenue" value={Number(c.total_spent || 0).toFixed(2)} icon={Wallet} tone="primary" hint="LTV" />
        <StatCard label="Total trips" value={c.total_trips ?? 0} icon={Repeat} tone="chart2" hint={`${c.completed_trips ?? 0} completed · ${c.cancelled_trips ?? 0} cancelled · ${c.no_show_trips ?? 0} no-show`} />
        <StatCard label="Avg booking" value={Number(c.avg_booking_value || 0).toFixed(2)} icon={TrendingUp} tone="success" />
        <StatCard label="Last booking" value={daysSince === null ? "—" : `${daysSince}d`} icon={CalendarDays} tone="warning" hint={c.last_booking_at ? new Date(c.last_booking_at).toLocaleDateString() : "No bookings yet"} />
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings ({bList.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 grid gap-6 md:grid-cols-2">
          <Card><CardContent className="p-5 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Preferences</div>
            <Row label="Favorite pickup" value={c.favorite_pickup} />
            <Row label="Favorite dropoff" value={c.favorite_dropoff} />
            <Row label="Preferred payment" value={c.preferred_payment_method} />
            <Row label="Preferred pickup hour" value={c.preferred_pickup_hour != null ? `${String(c.preferred_pickup_hour).padStart(2,"0")}:00` : null} />
            <Row label="Language" value={c.preferred_language} />
          </CardContent></Card>
          <Card><CardContent className="p-5 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold">Business</div>
            <Row label="Company" value={c.company} icon={Building2} />
            <Row label="VAT number" value={c.vat_number} />
            <Row label="Address" value={c.address} />
            <Row label="Created" value={new Date(c.created_at).toLocaleDateString()} />
            <Row label="First booking" value={c.first_booking_at ? new Date(c.first_booking_at).toLocaleDateString() : null} />
          </CardContent></Card>
          {upcoming.length > 0 && (
            <Card className="md:col-span-2"><CardContent className="p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold mb-3">Upcoming bookings</div>
              <div className="space-y-2">{upcoming.map((b: any) => <BookingRow key={b.id} b={b} />)}</div>
            </CardContent></Card>
          )}
          {c.notes && <Card className="md:col-span-2"><CardContent className="p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] text-gold mb-2">Notes</div>
            <p className="text-sm whitespace-pre-wrap">{c.notes}</p>
          </CardContent></Card>}
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <Card><CardContent className="p-3">
            {bList.length === 0 ? <div className="text-sm text-muted-foreground p-6 text-center">No bookings yet</div> : (
              <div className="divide-y divide-border/40">{bList.map((b: any) => <BookingRow key={b.id} b={b} />)}</div>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card><CardContent className="p-3">
            {(payments.data ?? []).length === 0 ? <div className="text-sm text-muted-foreground p-6 text-center">No payments</div> : (
              <div className="divide-y divide-border/40">
                {(payments.data ?? []).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-3 px-2">
                    <div>
                      <div className="text-sm font-medium">{Number(p.amount).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{p.method ?? "—"} · {new Date(p.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{p.booking?.code}</span>
                      <StatusBadge value={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card><CardContent className="p-5"><ActivityTimeline entityType="customer" entityId={c.id} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesPanel customerId={c.id} locale={locale} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsPanel customerId={c.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</span>
      <span className="text-end">{value || <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

function ContactItem({ icon: Icon, label, value, href }: { icon: any; label: string; value: string | null; href?: string }) {
  const inner = (
    <div className="rounded-lg border border-border/60 p-3 flex items-center gap-3 hover:border-gold/40 transition-colors bg-card/50">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold shrink-0"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value || <span className="text-muted-foreground">—</span>}</div>
      </div>
    </div>
  );
  if (href && value) return <a href={href} target="_blank" rel="noreferrer">{inner}</a>;
  return inner;
}

function BookingRow({ b }: { b: any }) {
  return (
    <Link to="/admin/bookings" className="flex items-center justify-between py-3 px-2 hover:bg-muted/30 rounded-md">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs">{b.code}</span>
          <StatusBadge value={b.status} />
          {b.category?.code && <Badge variant="outline" className="text-[10px]">{b.category.code}</Badge>}
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">{b.pickup_location} → {b.dropoff_location}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{b.pickup_at ? new Date(b.pickup_at).toLocaleString() : new Date(b.created_at).toLocaleDateString()} · {b.driver?.full_name ?? "Unassigned"}</div>
      </div>
      <div className="font-display text-lg shrink-0 ms-3">{Number(b.total_fare || 0).toFixed(2)}</div>
    </Link>
  );
}

function TagEditor({ customerId, tags, onChange }: { customerId: string; tags: string[]; onChange: () => void }) {
  const [val, setVal] = useState("");
  const save = async (next: string[]) => {
    const { error } = await supabase.from("customers").update({ tags: next }).eq("id", customerId);
    if (error) toast.error(error.message); else onChange();
  };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground me-1">Tags</span>
      {tags.map((t) => (
        <Badge key={t} variant="outline" className="gap-1">
          {t}
          <button onClick={() => save(tags.filter((x) => x !== t))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
        </Badge>
      ))}
      <div className="inline-flex items-center gap-1">
        <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Add tag" className="h-7 w-32 text-xs" onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) { save([...new Set([...tags, val.trim()])]); setVal(""); }
        }} />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (val.trim()) { save([...new Set([...tags, val.trim()])]); setVal(""); } }}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function EditCustomerDialog({ customer, onSaved }: { customer: any; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ ...customer });
  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        full_name: form.full_name, phone: form.phone, alt_phone: form.alt_phone, whatsapp: form.whatsapp, email: form.email,
        company: form.company, vat_number: form.vat_number, address: form.address, city: form.city, country: form.country,
        tier: form.tier, preferred_language: form.preferred_language, preferred_payment_method: form.preferred_payment_method,
        notes: form.notes,
      };
      Object.keys(payload).forEach((k) => { if (payload[k] === "") payload[k] = null; });
      const { error } = await supabase.from("customers").update(payload).eq("id", customer.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); setOpen(false); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Save className="h-4 w-4 me-1" />Edit</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit customer</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><Label>Name</Label><Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Alt phone</Label><Input value={form.alt_phone ?? ""} onChange={(e) => setForm({ ...form, alt_phone: e.target.value })} /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Company</Label><Input value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div><Label>VAT number</Label><Input value={form.vat_number ?? ""} onChange={(e) => setForm({ ...form, vat_number: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Address</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>City</Label><Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label>Country</Label><Input value={form.country ?? ""} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          <div>
            <Label>Tier</Label>
            <Select value={form.tier ?? "regular"} onValueChange={(v) => setForm({ ...form, tier: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Language</Label>
            <Select value={form.preferred_language ?? "en"} onValueChange={(v) => setForm({ ...form, preferred_language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ar">العربية</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Preferred payment</Label><Input value={form.preferred_payment_method ?? ""} onChange={(e) => setForm({ ...form, preferred_payment_method: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotesPanel({ customerId, locale }: { customerId: string; locale: string }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<string>("note");
  const [body, setBody] = useState("");
  const notes = useQuery({
    queryKey: ["customer-notes", customerId],
    queryFn: async () => (await supabase.from("customer_notes").select("*").eq("customer_id", customerId).order("pinned", { ascending: false }).order("created_at", { ascending: false })).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("customer_notes").insert({ customer_id: customerId, kind: kind as any, body, author_id: userData.user?.id });
      if (error) throw error;
    },
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["customer-notes", customerId] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const togglePin = async (n: any) => {
    const { error } = await supabase.from("customer_notes").update({ pinned: !n.pinned }).eq("id", n.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["customer-notes", customerId] });
  };
  const remove = async (n: any) => {
    const { error } = await supabase.from("customer_notes").delete().eq("id", n.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["customer-notes", customerId] });
  };
  return (
    <Card><CardContent className="p-5 space-y-4">
      <div className="grid gap-2 md:grid-cols-[auto_1fr_auto]">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{NOTE_KINDS.map((k) => <SelectItem key={k} value={k}>{NOTE_KIND_LABEL[k]}</SelectItem>)}</SelectContent>
        </Select>
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder={locale === "ar" ? "أضف ملاحظة..." : "Add note, call log, WhatsApp exchange…"} />
        <Button disabled={!body.trim() || add.isPending} onClick={() => add.mutate()}><Plus className="h-4 w-4 me-1" />Add</Button>
      </div>
      <div className="space-y-2">
        {(notes.data ?? []).length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No notes yet</div>}
        {(notes.data ?? []).map((n: any) => (
          <div key={n.id} className={`rounded-lg border p-3 ${n.pinned ? "border-gold/40 bg-gold/5" : "border-border/60"}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{NOTE_KIND_LABEL[n.kind] ?? n.kind}</Badge>
                {n.pinned && <Star className="h-3 w-3 fill-gold text-gold" />}
                <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(n)}>{n.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}</Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => remove(n)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{n.body}</p>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}

function DocumentsPanel({ customerId }: { customerId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [docType, setDocType] = useState("id");
  const [uploading, setUploading] = useState(false);

  const docs = useQuery({
    queryKey: ["customer-docs", customerId],
    queryFn: async () => (await supabase.from("customer_documents").select("*").eq("customer_id", customerId).order("created_at", { ascending: false })).data ?? [],
  });

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const path = `${customerId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("customer-documents").upload(path, file);
      if (upErr) throw upErr;
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("customer_documents").insert({
        customer_id: customerId, doc_type: docType, label: label || file.name,
        file_path: path, file_size: file.size, mime_type: file.type, uploaded_by: userData.user?.id,
      });
      if (error) throw error;
      toast.success("Uploaded");
      setLabel("");
      qc.invalidateQueries({ queryKey: ["customer-docs", customerId] });
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const download = async (d: any) => {
    const { data, error } = await supabase.storage.from("customer-documents").createSignedUrl(d.file_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (d: any) => {
    await supabase.storage.from("customer-documents").remove([d.file_path]);
    const { error } = await supabase.from("customer_documents").delete().eq("id", d.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["customer-docs", customerId] });
  };

  return (
    <Card><CardContent className="p-5 space-y-4">
      <div className="grid gap-2 md:grid-cols-[auto_auto_1fr_auto]">
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="id">ID</SelectItem>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="license">License</SelectItem>
            <SelectItem value="visa">Visa</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} className="w-48" />
        <Input type="file" ref={fileRef} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
        <Button disabled={uploading} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 me-1" />{uploading ? "Uploading…" : "Upload"}</Button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {(docs.data ?? []).length === 0 && <div className="md:col-span-2 text-sm text-muted-foreground text-center py-6">No documents</div>}
        {(docs.data ?? []).map((d: any) => (
          <div key={d.id} className="rounded-lg border border-border/60 p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted"><FileText className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{d.label || d.file_path.split("/").pop()}</div>
              <div className="text-[10px] text-muted-foreground">{d.doc_type} · {(d.file_size / 1024).toFixed(0)} KB · {new Date(d.created_at).toLocaleDateString()}</div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => download(d)}><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => remove(d)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </CardContent></Card>
  );
}
