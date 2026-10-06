import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/cart";
import { ORDER_STATUSES } from "@/lib/store";
import { PageTitle, Panel, StatusBadge, adminMeta, field } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => adminMeta("Orders", "All pickup orders with status and customer details."),
  component: Orders,
});

function Orders() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: async () => {
      let r = supabase.from("orders").select("id,order_code,customer_name,customer_phone,total,status,created_at").order("created_at", { ascending: false }).limit(300);
      if (status) r = r.eq("status", status);
      const { data, error } = await r;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
  const term = q.trim().toLowerCase();
  const rows = term ? data.filter((o) => `${o.order_code} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(term)) : data;

  return (
    <div>
      <PageTitle sub="New orders refresh every 30 seconds">Orders</PageTitle>
      <Panel>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input className={field} placeholder="Search code, name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={`${field} sm:w-52`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No orders found.</p> : (
          <ul className="divide-y">
            {rows.map((o) => (
              <li key={o.id}>
                <Link to="/admin/order/$id" params={{ id: o.id }} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:bg-muted/50">
                  <div>
                    <p className="font-semibold">{o.order_code} · {o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_phone} · {new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">{inr(Number(o.total))}<StatusBadge status={o.status} /></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
