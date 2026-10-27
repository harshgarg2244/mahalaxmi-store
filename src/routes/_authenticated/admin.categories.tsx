import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, adminMeta, btn, field, fieldSm } from "@/components/admin/kit";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => adminMeta("Categories", "Add, rename and hide store categories."),
  component: Categories,
});

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Categories() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [parent, setParent] = useState("");
  const tops = data.filter((c) => !c.parent_id);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); qc.invalidateQueries({ queryKey: ["categories"] }); };

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), icon: icon || null, parent_id: parent || null, slug: `${slugify(name)}-${Date.now().toString(36)}`, sort_order: data.length + 1 });
    if (error) { toast.error(error.message); return; }
    setName(""); setIcon(""); toast.success("Category added"); refresh();
  }
  async function update(id: string, patch: { name?: string; icon?: string; is_active?: boolean }) {
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); refresh();
  }

  return (
    <div className="space-y-4">
      <PageTitle sub={`${tops.length} main categories`}>Categories</PageTitle>
      <Panel title="Add category">
        <form onSubmit={add} className="grid gap-2 sm:grid-cols-[80px_1fr_220px_auto]">
          <input className={field} placeholder="Emoji" value={icon} onChange={(e) => setIcon(e.target.value)} />
          <input className={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={field} value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="">Main category</option>
            {tops.map((c) => <option key={c.id} value={c.id}>Inside: {c.name}</option>)}
          </select>
          <button className={btn}>Add</button>
        </form>
      </Panel>
      <Panel>
        <ul className="divide-y">
          {tops.map((c) => (
            <li key={c.id} className="py-2">
              <CatRow c={c} onSave={update} />
              <ul className="ml-8 border-l pl-3">
                {data.filter((s) => s.parent_id === c.id).map((s) => <li key={s.id}><CatRow c={s} onSave={update} /></li>)}
              </ul>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function CatRow({ c, onSave }: { c: { id: string; name: string; icon: string | null; is_active: boolean }; onSave: (id: string, p: { name?: string; icon?: string; is_active?: boolean }) => void }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <input defaultValue={c.icon ?? ""} className={`${fieldSm} w-14 text-center`} onBlur={(e) => e.target.value !== (c.icon ?? "") && onSave(c.id, { icon: e.target.value })} />
      <input defaultValue={c.name} className={field} onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && onSave(c.id, { name: e.target.value.trim() })} />
      <label className="flex shrink-0 items-center gap-1 text-xs"><input type="checkbox" checked={c.is_active} onChange={(e) => onSave(c.id, { is_active: e.target.checked })} />Visible</label>
    </div>
  );
}
