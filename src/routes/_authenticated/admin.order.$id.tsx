import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/cart";
import { ORDER_STATUSES, waLink } from "@/lib/store";
import { PageTitle, Panel, StatusBadge, adminMeta, btn, btnGhost } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/order/$id")({
  head: () => adminMeta("Order details", "Pickup order items, customer contact and status."),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: o, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function setStatus(status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-order", id] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-overview"] });
  }

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!o) return <p>Order not found. <Link to="/admin/orders" className="text-primary">Back to orders</Link></p>;

  const msg = o.status === "Ready for Pickup"
    ? `Namaste ${o.customer_name}, your order ${o.order_code} (${inr(Number(o.total))}) is ready for pickup at Mahalaxmi General Store. Please pay at the counter.`
    : `Namaste ${o.customer_name}, about your order ${o.order_code} at Mahalaxmi General Store:`;

  return (
    <div className="space-y-4">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Orders</Link>
      <PageTitle sub={new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}>
        {o.order_code} <StatusBadge status={o.status} />
      </PageTitle>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <Panel title="Items">
            <ul className="divide-y text-sm">
              {o.order_items.map((i) => (
                <li key={i.id} className="flex justify-between py-2">
                  <span>{i.product_name} <span className="text-muted-foreground">({i.variant_name}) × {i.quantity}</span></span>
                  <span className="font-semibold">{inr(Number(i.total_price))}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t pt-2 font-display text-lg font-bold"><span>Total · pay at counter</span><span>{inr(Number(o.total))}</span></div>
            {o.note && <p className="mt-2 rounded-lg bg-muted p-2 text-sm">Note: {o.note}</p>}
          </Panel>
          <Panel title="Update status">
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <button key={s} onClick={() => setStatus(s)} disabled={s === o.status} className={s === o.status ? btn : btnGhost}>{s}</button>
              ))}
            </div>
          </Panel>
        </div>
        <Panel title="Customer">
          <p className="font-semibold">{o.customer_name}</p>
          <p className="text-sm text-muted-foreground">{o.customer_phone}</p>
          <div className="mt-3 flex flex-col gap-2">
            <a href={waLink(o.customer_phone, msg)} target="_blank" rel="noreferrer" className={btn}><MessageCircle className="h-4 w-4" />WhatsApp customer</a>
            <a href={`tel:${o.customer_phone}`} className={btnGhost}><Phone className="h-4 w-4" />Call</a>
          </div>
        </Panel>
      </div>
    </div>
  );
}
