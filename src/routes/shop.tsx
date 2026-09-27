import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { categoriesQuery, productsQuery, productIcon } from "@/lib/store";
import { ProductCard } from "@/components/store/ProductCard";

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    cat: typeof s.cat === "string" ? s.cat : "",
  }),
  head: () => ({
    meta: [
      { title: "Shop Groceries — Mahalaxmi General Store" },
      { name: "description", content: "Browse and search all products with prices and sizes. Pay on delivery." },
      { property: "og:title", content: "Shop Groceries — Mahalaxmi General Store" },
      { property: "og:description", content: "All products, all sizes, local prices." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(productsQuery),
    ]),
  component: Shop,
});

function Shop() {
  const { q, cat } = Route.useSearch();
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const [sort, setSort] = useState("name");

  const current = cats.find((c) => c.slug === cat);
  const parent = current?.parent_id ? cats.find((c) => c.id === current.parent_id) : current;
  const subs = parent ? cats.filter((c) => c.parent_id === parent.id) : [];

  const list = useMemo(() => {
    let l = products;
    if (current) {
      const ids = new Set([current.id, ...cats.filter((c) => c.parent_id === current.id).map((c) => c.id)]);
      l = l.filter((p) => p.category_id && ids.has(p.category_id));
    }
    if (q) {
      const t = q.toLowerCase();
      l = l.filter((p) => `${p.name} ${p.brand ?? ""} ${p.categories?.name ?? ""}`.toLowerCase().includes(t));
    }
    const price = (p: (typeof l)[number]) => p.product_variants[0]?.price ?? 0;
    return [...l].sort((a, b) => (sort === "low" ? price(a) - price(b) : sort === "high" ? price(b) - price(a) : a.name.localeCompare(b.name)));
  }, [products, cats, current, q, sort]);

  const chip = "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold";
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold">
        {q ? `Results for “${q}”` : parent ? `${parent.icon ?? ""} ${parent.name}` : "All products"}
      </h1>
      {parent && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Link to="/shop" search={{ q, cat: parent.slug }} className={`${chip} ${current?.id === parent.id ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>All</Link>
          {subs.map((s) => (
            <Link key={s.id} to="/shop" search={{ q, cat: s.slug }} className={`${chip} ${current?.id === s.id ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{s.name}</Link>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{list.length} products</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border bg-card px-2 py-1.5" aria-label="Sort">
          <option value="name">Name</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>
      {list.length === 0 ? (
        <div className="mt-10 text-center text-muted-foreground">
          No products found. <Link to="/categories" className="font-semibold text-primary">Browse categories</Link>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((p) => <ProductCard key={p.id} product={p} icon={productIcon(p, cats)} />)}
        </div>
      )}
    </div>
  );
}
