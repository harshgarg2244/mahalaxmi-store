import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type Variant = Tables<"product_variants">;
export type Product = Tables<"products"> & {
  product_variants: Variant[];
  categories: Pick<Category, "id" | "name" | "slug" | "icon" | "parent_id"> | null;
};

const PRODUCT_SELECT = "*, product_variants(*), categories(id,name,slug,icon,parent_id)";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60_000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return (data as unknown as Product[]).map((p) => ({
      ...p,
      product_variants: [...p.product_variants].sort((a, b) => a.sort_order - b.sort_order),
    }));
  },
  staleTime: 60_000,
});

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60_000,
});

/** Emoji for a product: its category's icon, or the parent category's icon. */
export function productIcon(p: Product, cats: Category[]) {
  const c = p.categories;
  if (c?.icon) return c.icon;
  const parent = cats.find((x) => x.id === c?.parent_id);
  return parent?.icon ?? "🛒";
}

export function topLevelOf(catId: string | null, cats: Category[]) {
  const c = cats.find((x) => x.id === catId);
  if (!c) return undefined;
  return c.parent_id ? cats.find((x) => x.id === c.parent_id) : c;
}

export const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Packed",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? "91" + digits : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}
