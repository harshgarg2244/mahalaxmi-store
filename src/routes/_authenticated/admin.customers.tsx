import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/cart";
import { waLink } from "@/lib/store";
import { PageTitle, Panel, adminMeta, field } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => adminMeta("Customers", "Everyone who has booked a pickup order, with totals."),
  component: Customers,
});

function Customers() {
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("customer_name,customer_phone,total,status,created_at").order("created_at", { ascending: false }).limit(2000);
      if (error) throw error;
      const map = new Map<string, { name: string; phone: string; orders: number; spent: number; last: string }>();
      for (const o of data) {
        const c = map.get(o.customer_phone) ?? { name: o.customer_name, phone: o.customer_phone, orders: 0, spent: 0, last: o.created_at };
        c.orders++;
        if (o.status !== "Cancelled") c.spent += Number(o.total);
        map.set(o.customer_phone, c);
      }
      return [...map.values()];
    },
  });
  const t = q.trim().toLowerCase();
  const rows = t ? data.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(t)) : data;
  return (
    <div>
      <PageTitle sub={`${data.length} customers`}>Customers</PageTitle>
      <Panel>
        <input className={`${field} mb-3`} placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No customers yet.</p> : (
          <ul className="divide-y">
            {rows.map((c) => (
              <li key={c.phone} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted-foreground">{c.phone} · last order {new Date(c.last).toLocaleDateString("en-IN")}</p></div>
                <div className="flex items-center gap-3">
                  <span>{c.orders} orders · <b>{inr(c.spent)}</b></span>
                  <a href={waLink(c.phone, `Namaste ${c.name}, `)} target="_blank" rel="noreferrer" className="rounded-lg bg-primary p-2 text-primary-foreground" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
