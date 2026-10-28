import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/cart";
import { waLink } from "@/lib/store";
import { PageTitle, Panel, StatusBadge, adminMeta, field } from "@/components/admin/kit";

type OrderRow = {
  id: string;
  order_code: string;
  total: number;
  status: string;
  created_at: string;
  order_items: { product_name: string; variant_name: string; quantity: number; total_price: number }[];
};

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => adminMeta("Customers", "Everyone who has booked a pickup order, with totals and full order history."),
  component: Customers,
});

function Customers() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_code,customer_name,customer_phone,customer_whatsapp,total,status,created_at,order_items(product_name,variant_name,quantity,total_price)")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      const map = new Map<string, { name: string; phone: string; whatsapp: string; orders: OrderRow[]; spent: number }>();
      for (const o of data) {
        const c = map.get(o.customer_phone) ?? {
          name: o.customer_name,
          phone: o.customer_phone,
          whatsapp: o.customer_whatsapp || o.customer_phone,
          orders: [],
          spent: 0,
        };
        if (o.status !== "Cancelled") c.spent += Number(o.total);
        c.orders.push(o as unknown as OrderRow);
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
            {rows.map((c) => {
              const expanded = open === c.phone;
              return (
                <li key={c.phone}>
                  <button
                    onClick={() => setOpen(expanded ? null : c.phone)}
                    aria-expanded={expanded}
                    className="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.phone}
                          {c.whatsapp !== c.phone ? ` · WhatsApp ${c.whatsapp}` : ""}
                          {" · last order "}
                          {c.orders[0] ? new Date(c.orders[0].created_at).toLocaleDateString("en-IN") : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{c.orders.length} orders · <b>{inr(c.spent)}</b></span>
                      <a
                        href={waLink(c.whatsapp || c.phone, `Namaste ${c.name}, `)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg bg-primary p-2 text-primary-foreground"
                        aria-label={`WhatsApp ${c.name}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </div>
                  </button>
                  {expanded && (
                    <div className="pb-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order history</p>
                      <ul className="space-y-2">
                        {c.orders.map((o) => (
                          <li key={o.id} className="rounded-xl border bg-background p-3 text-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold">{o.order_code}</p>
                                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{inr(o.total)}</span>
                                <StatusBadge status={o.status} />
                              </div>
                            </div>
                            {o.order_items.length > 0 && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {o.order_items.map((i) => `${i.product_name} (${i.variant_name}) × ${i.quantity}`).join(", ")}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
