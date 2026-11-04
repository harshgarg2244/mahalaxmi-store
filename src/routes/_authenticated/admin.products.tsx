import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, adminMeta, field, fieldSm, btn, btnGhost } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => adminMeta("Products", "Add and edit products, sizes, prices and visibility."),
  component: Products,
});

type V = { id: string; variant_name: string; price: number; mrp: number | null; stock_quantity: number };
type P = { id: string; name: string; brand: string | null; is_active: boolean; is_featured: boolean; image_url: string | null; product_variants: V[] };

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);

function Products() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id,name,brand,is_active,is_featured,image_url,product_variants(id,variant_name,price,mrp,stock_quantity)").order("name");
      if (error) throw error;
      return data as unknown as P[];
    },
  });
  const { data: cats = [] } = useQuery({
    queryKey: ["admin-cats-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name,parent_id").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); };
  async function upd(table: "products" | "product_variants", id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from(table).update(patch as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); refresh();
  }
  async function delVariant(v: V) {
    if (!window.confirm(`Remove size "${v.variant_name}" from this product? Past orders are not affected.`)) return;
    const { error } = await supabase.from("product_variants").delete().eq("id", v.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Size removed"); refresh();
  }
  async function addVariant(productId: string, f: HTMLFormElement) {
    const d = new FormData(f);
    const name = String(d.get("name") ?? "").trim();
    const price = Number(d.get("price"));
    if (!name || !(price > 0)) { toast.error("Enter a size name and price."); return; }
    const { error } = await supabase.from("product_variants").insert({
      product_id: productId, variant_name: name, price,
      mrp: d.get("mrp") ? Number(d.get("mrp")) : null,
      stock_quantity: Number(d.get("stock") || 0),
    });
    if (error) { toast.error(error.message); return; }
    f.reset(); toast.success("Size added"); refresh();
  }
  async function addProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const name = String(d.get("name") ?? "").trim();
    const size = String(d.get("size") ?? "").trim();
    const price = Number(d.get("price"));
    if (!name || !size || !(price > 0)) { toast.error("Enter name, size and price."); return; }
    const { data: p, error } = await supabase.from("products").insert({
      name, slug: slugify(name),
      brand: String(d.get("brand") ?? "").trim() || null,
      category_id: String(d.get("cat") ?? "") || null,
      description: String(d.get("desc") ?? "").trim() || null,
      image_url: String(d.get("img") ?? "").trim() || null,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    const { error: e2 } = await supabase.from("product_variants").insert({
      product_id: p.id, variant_name: size, price,
      mrp: d.get("mrp") ? Number(d.get("mrp")) : null,
      stock_quantity: Number(d.get("stock") || 0),
    });
    if (e2) { toast.error(e2.message); return; }
    toast.success("Product added"); setAdding(false); refresh();
  }
  const t = q.trim().toLowerCase();
  const rows = t ? data.filter((p) => p.name.toLowerCase().includes(t)) : data;
  const catName = (c: { name: string; parent_id: string | null }) => {
    const parent = cats.find((x) => x.id === c.parent_id);
    return parent ? `${parent.name} › ${c.name}` : c.name;
  };
  return (
    <div className="space-y-4">
      <PageTitle sub="Change a price and click outside the box to save">Products</PageTitle>
      <Panel title="Add a product" action={<button className={btnGhost} onClick={() => setAdding(!adding)}><Plus className="h-4 w-4" />{adding ? "Close" : "New product"}</button>}>
        {adding && (
          <form onSubmit={addProduct} className="grid gap-2 sm:grid-cols-2">
            <input name="name" className={field} placeholder="Product name *" required />
            <input name="brand" className={field} placeholder="Brand" />
            <select name="cat" className={field} defaultValue="">
              <option value="">Choose category</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{catName(c)}</option>)}
            </select>
            <input name="img" className={field} placeholder="Photo link (optional)" />
            <input name="size" className={field} placeholder="Size, e.g. 1 kg *" required />
            <div className="flex gap-2">
              <input name="price" type="number" min={0} step="0.01" className={field} placeholder="Price ₹ *" required />
              <input name="mrp" type="number" min={0} step="0.01" className={field} placeholder="MRP ₹" />
              <input name="stock" type="number" min={0} className={field} placeholder="Stock" />
            </div>
            <textarea name="desc" className={`${field} sm:col-span-2`} placeholder="Description" rows={2} />
            <button className={`${btn} sm:col-span-2`}>Add product</button>
          </form>
        )}
      </Panel>
      <Panel>
        <input className={`${field} mb-3`} placeholder="Search product" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="divide-y">
          {rows.map((p) => (
            <li key={p.id} className="py-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex-1 font-semibold">{p.name}{p.brand && <span className="ml-1 font-normal text-muted-foreground">· {p.brand}</span>}</span>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={p.is_active} onChange={(e) => upd("products", p.id, { is_active: e.target.checked })} />Visible</label>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={p.is_featured} onChange={(e) => upd("products", p.id, { is_featured: e.target.checked })} />Featured</label>
              </div>
              {p.product_variants.map((v) => (
                <div key={v.id} className="mt-1 flex flex-wrap items-center gap-2 pl-4 text-xs">
                  <span className="w-24">{v.variant_name}</span>
                  ₹<input type="number" min={0} defaultValue={v.price} className={`${fieldSm} w-20`} onBlur={(e) => Number(e.target.value) !== v.price && upd("product_variants", v.id, { price: Number(e.target.value) })} />
                  MRP ₹<input type="number" min={0} defaultValue={v.mrp ?? ""} className={`${fieldSm} w-20`} onBlur={(e) => Number(e.target.value) !== (v.mrp ?? 0) && upd("product_variants", v.id, { mrp: e.target.value ? Number(e.target.value) : null })} />
                  <span className="text-muted-foreground">Stock {v.stock_quantity}</span>
                  <button type="button" onClick={() => delVariant(v)} title="Remove this size" className="ml-1 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">✕</button>
                </div>
              ))}
              <form className="mt-2 flex flex-wrap items-center gap-2 pl-4 text-xs" onSubmit={(e) => { e.preventDefault(); addVariant(p.id, e.currentTarget); }}>
                <input name="name" className={`${fieldSm} w-24`} placeholder="New size" />
                <input name="price" type="number" min={0} step="0.01" className={`${fieldSm} w-20`} placeholder="Price" />
                <input name="mrp" type="number" min={0} step="0.01" className={`${fieldSm} w-20`} placeholder="MRP" />
                <input name="stock" type="number" min={0} className={`${fieldSm} w-20`} placeholder="Stock" />
                <button className={btnGhost}><Plus className="h-3 w-3" />Add size</button>
              </form>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
