import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, adminMeta, field } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => adminMeta("Products", "Edit product prices and visibility."),
  component: Products,
});

type P = { id: string; name: string; is_active: boolean; is_featured: boolean; product_variants: { id: string; variant_name: string; price: number; mrp: number | null }[] };

function Products() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id,name,is_active,is_featured,product_variants(id,variant_name,price,mrp)").order("name");
      if (error) throw error;
      return data as unknown as P[];
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); };
  async function upd(table: "products" | "product_variants", id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from(table).update(patch as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); refresh();
  }
  const t = q.trim().toLowerCase();
  const rows = t ? data.filter((p) => p.name.toLowerCase().includes(t)) : data;
  return (
    <div>
      <PageTitle sub="Change a price and click outside the box to save">Products</PageTitle>
      <Panel>
        <input className={`${field} mb-3`} placeholder="Search product" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="divide-y">
          {rows.map((p) => (
            <li key={p.id} className="py-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex-1 font-semibold">{p.name}</span>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={p.is_active} onChange={(e) => upd("products", p.id, { is_active: e.target.checked })} />Visible</label>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={p.is_featured} onChange={(e) => upd("products", p.id, { is_featured: e.target.checked })} />Featured</label>
              </div>
              {p.product_variants.map((v) => (
                <div key={v.id} className="mt-1 flex items-center gap-2 pl-4 text-xs">
                  <span className="w-24">{v.variant_name}</span>
                  ₹<input type="number" min={0} defaultValue={v.price} className={`${field} w-20`} onBlur={(e) => Number(e.target.value) !== v.price && upd("product_variants", v.id, { price: Number(e.target.value) })} />
                  MRP ₹<input type="number" min={0} defaultValue={v.mrp ?? ""} className={`${field} w-20`} onBlur={(e) => Number(e.target.value) !== (v.mrp ?? 0) && upd("product_variants", v.id, { mrp: e.target.value ? Number(e.target.value) : null })} />
                </div>
              ))}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
