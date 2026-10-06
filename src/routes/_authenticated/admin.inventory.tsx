import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, adminMeta, field } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => adminMeta("Stock", "Update stock counts for every product size."),
  component: Inventory,
});

type Row = { id: string; variant_name: string; stock_quantity: number; is_available: boolean; products: { name: string } | null };

function Inventory() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_variants").select("id,variant_name,stock_quantity,is_available,products(name)").order("stock_quantity").limit(2000);
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  async function save(id: string, patch: { stock_quantity?: number; is_available?: boolean }) {
    const { error } = await supabase.from("product_variants").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["admin-inventory"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  const t = q.trim().toLowerCase();
  const rows = data.filter((r) => (!lowOnly || r.stock_quantity < 5) && (!t || `${r.products?.name} ${r.variant_name}`.toLowerCase().includes(t)));
  return (
    <div>
      <PageTitle sub="Change a number and click outside the box to save">Stock</PageTitle>
      <Panel>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input className={field} placeholder="Search product" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="flex shrink-0 items-center gap-2 text-sm"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />Low stock only</label>
        </div>
        <ul className="divide-y">
          {rows.slice(0, 300).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{r.products?.name} <span className="text-muted-foreground">({r.variant_name})</span></span>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={r.is_available} onChange={(e) => save(r.id, { is_available: e.target.checked })} />On sale</label>
              <input type="number" min={0} defaultValue={r.stock_quantity} key={r.stock_quantity}
                className={`${field} w-20 ${r.stock_quantity < 5 ? "border-destructive" : ""}`}
                onBlur={(e) => { const n = Math.max(0, parseInt(e.target.value) || 0); if (n !== r.stock_quantity) save(r.id, { stock_quantity: n }); }} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
