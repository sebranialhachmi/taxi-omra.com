import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/_authenticated/admin/bookings/$id/print")({
  component: PrintBooking,
});

function PrintBooking() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["booking-print", id],
    queryFn: async () => (await supabase.from("bookings")
      .select("*, customer:customers(full_name, phone, email), driver:drivers(full_name, phone), vehicle:vehicles(plate_number, make, model), category:vehicle_categories(code)")
      .eq("id", id).maybeSingle()).data,
  });

  useEffect(() => { if (q.data) setTimeout(() => window.print(), 400); }, [q.data]);

  const b: any = q.data;
  if (!b) return <div className="p-8">Loading…</div>;

  return (
    <div className="min-h-screen bg-white text-black p-10 print:p-6 max-w-3xl mx-auto text-sm">
      <style>{`@media print { body { background: #fff; } .no-print { display: none; } }`}</style>
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div className="flex items-center gap-3">
          <img src={SITE.logo} alt={SITE.brand.en} className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-3xl font-serif">{SITE.brand.en}</h1>
            <div className="text-xs text-neutral-600 mt-1">{SITE.tagline.en}</div>
          </div>
        </div>
        <div className="text-end">
          <div className="text-xs uppercase tracking-widest text-neutral-600">Booking</div>
          <div className="font-mono text-xl">{b.code}</div>
          <div className="text-xs uppercase mt-1">{b.status}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-600">Customer</div>
          <div className="text-lg">{b.customer?.full_name}</div>
          <div className="text-xs">{b.customer?.phone}</div>
          <div className="text-xs">{b.customer?.email}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-600">Driver</div>
          <div className="text-lg">{b.driver?.full_name ?? "—"}</div>
          <div className="text-xs">{b.driver?.phone}</div>
          <div className="text-xs mt-2">{b.vehicle ? `${b.vehicle.make} ${b.vehicle.model} · ${b.vehicle.plate_number}` : ""}</div>
        </div>
      </div>

      <div className="border-y border-black py-4 mb-6 space-y-2">
        <div><span className="text-xs uppercase tracking-widest text-neutral-600 inline-block w-24">Pickup</span> {b.pickup_location}</div>
        <div><span className="text-xs uppercase tracking-widest text-neutral-600 inline-block w-24">Dropoff</span> {b.dropoff_location}</div>
        <div><span className="text-xs uppercase tracking-widest text-neutral-600 inline-block w-24">When</span> {new Date(b.pickup_at).toLocaleString()}</div>
        <div><span className="text-xs uppercase tracking-widest text-neutral-600 inline-block w-24">Category</span> {b.category?.code ?? "—"}</div>
        <div><span className="text-xs uppercase tracking-widest text-neutral-600 inline-block w-24">Distance</span> {Number(b.distance_km || 0).toFixed(1)} km · {b.duration_min ?? "—"} min</div>
      </div>

      <table className="w-full text-sm">
        <tbody>
          <tr><td className="py-1">Base fare</td><td className="text-end font-mono">{Number(b.base_fare).toFixed(2)}</td></tr>
          <tr><td className="py-1">Distance</td><td className="text-end font-mono">{Number(b.distance_fare).toFixed(2)}</td></tr>
          <tr><td className="py-1">Time</td><td className="text-end font-mono">{Number(b.time_fare).toFixed(2)}</td></tr>
          <tr><td className="py-1">Waiting</td><td className="text-end font-mono">{Number(b.waiting_fare).toFixed(2)}</td></tr>
          <tr><td className="py-1">Airport fee</td><td className="text-end font-mono">{Number(b.airport_fee).toFixed(2)}</td></tr>
          <tr><td className="py-1">Night surcharge</td><td className="text-end font-mono">{Number(b.night_surcharge).toFixed(2)}</td></tr>
          {Number(b.discount) > 0 && <tr><td className="py-1">Discount</td><td className="text-end font-mono">-{Number(b.discount).toFixed(2)}</td></tr>}
          <tr className="border-t-2 border-black font-bold text-lg"><td className="py-2">Total</td><td className="text-end font-mono">{Number(b.total_fare).toFixed(2)} SAR</td></tr>
        </tbody>
      </table>

      {b.notes && <div className="mt-6 border-t pt-3 text-xs"><strong>Notes:</strong> {b.notes}</div>}

      <div className="mt-10 text-center text-xs text-neutral-500">
        {SITE.brand.en} · {SITE.phone} · {SITE.email}
      </div>

      <div className="no-print mt-6 text-center">
        <button onClick={() => window.print()} className="px-4 py-2 border rounded">Print</button>
      </div>
    </div>
  );
}
