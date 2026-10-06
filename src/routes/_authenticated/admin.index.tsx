import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/cart";
import { Panel, PageTitle, StatusBadge, adminMeta } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => adminMeta("Overview", "Today's pickup orders, sales and low stock at a glance."),
  component: Overview,
});

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const [orders, low, products] = await Promise.all([
        supabase.from("orders").select("id,order_code,customer_name,total,status,created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("product_variants").select("id,variant_name,stock_quantity,products(name)").lt("stock_quantity", 5).order("stock_quantity").limit(10),
        supabase.from("products").select("id", { count: "exact", head: true }),
      ]);
      const all = orders.data ?? [];
      const today = all.filter((o) => new Date(o.created_at) >= start);
      return {
        recent: all.slice(0, 8),
        todayCount: today.length,
        todaySales: today.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + Number(o.total), 0),
        pending: all.filter((o) => o.status === "Pending").length,
        ready: all.filter((o) => o.status === "Ready for Pickup").length,
        low: (low.data ?? []) as unknown as { id: string; variant_name: string; stock_quantity: number; products: { name: string } | null }[],
        productCount: products.count ?? 0,
      };
    },
    refetchInterval: 30_000,
  });

  const stats = [
    ["Orders today", data?.todayCount ?? "—"],
    ["Sales today", data ? inr(data.todaySales) : "—"],
    ["New (pending)", data?.pending ?? "—"],
    ["Ready for pickup", data?.ready ?? "—"],
  ];
  return (
    <div className="space-y-4">
      <PageTitle sub={`${data?.productCount ?? 0} products in the catalog`}>Overview</PageTitle>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="font-display text-2xl font-bold">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Latest orders" action={<Link to="/admin/orders" className="text-sm text-primary">All orders</Link>}>
          {data?.recent.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
          <ul className="divide-y">
            {data?.recent.map((o) => (
              <li key={o.id}>
                <Link to="/admin/order/$id" params={{ id: o.id }} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span><span className="font-semibold">{o.order_code}</span> · {o.customer_name}</span>
                  <span className="flex items-center gap-2">{inr(Number(o.total))}<StatusBadge status={o.status} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Low stock" action={<Link to="/admin/inventory" className="text-sm text-primary">Manage stock</Link>}>
          {data?.low.length === 0 && <p className="text-sm text-muted-foreground">Everything is well stocked.</p>}
          <ul className="divide-y">
            {data?.low.map((v) => (
              <li key={v.id} className="flex justify-between py-2 text-sm">
                <span>{v.products?.name} <span className="text-muted-foreground">({v.variant_name})</span></span>
                <span className={v.stock_quantity === 0 ? "font-semibold text-destructive" : "font-semibold"}>{v.stock_quantity} left</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
