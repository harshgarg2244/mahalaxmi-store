import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { categoriesQuery, productsQuery, productIcon } from "@/lib/store";
import { useCart, inr } from "@/lib/cart";
import { ProductCard, QtyControl } from "@/components/store/ProductCard";
import { ProductVisual } from "@/components/store/ProductVisual";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(categoriesQuery);
    const products = await context.queryClient.ensureQueryData(productsQuery);
    const p = products.find((x) => x.slug === params.slug);
    if (!p) throw notFound();
    return { name: p.name, brand: p.brand };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Product not found" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.name} — Mahalaxmi General Store`;
    const d = `Book ${loaderData.name}${loaderData.brand ? ` by ${loaderData.brand}` : ""} for store pickup.`;
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary" }] };
  },
  notFoundComponent: () => (
    <div className="p-10 text-center">Product not found. <Link to="/shop" search={{ q: "", cat: "" }} className="text-primary">Back to shop</Link></div>
  ),
  errorComponent: () => <div className="p-10 text-center">Couldn't load this product.</div>,
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(productsQuery);
  const cart = useCart();
  const p = products.find((x) => x.slug === slug);
  if (!p) return null;
  const icon = productIcon(p, cats);
  const variants = p.product_variants.filter((v) => v.is_available);
  const [vid, setVid] = useState(variants[0]?.id);
  const v = variants.find((x) => x.id === vid);
  const related = products.filter((x) => x.category_id === p.category_id && x.id !== p.id).slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link to="/shop" search={{ q: "", cat: p.categories?.slug ?? "" }} className="mb-4 inline-flex items-center text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> {p.categories?.name ?? "Shop"}
      </Link>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
          <ProductVisual src={p.image_url} name={p.name} category={p.categories?.name} className="h-full w-full object-cover" />
        </div>
        <div>
          {p.brand && <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{p.brand}</p>}
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{p.name}</h1>
          {p.description && <p className="mt-2 text-muted-foreground">{p.description}</p>}
          <p className="mt-5 text-sm font-semibold">Choose size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((x) => (
              <button key={x.id} onClick={() => setVid(x.id)}
                className={`rounded-xl border-2 px-4 py-2 text-left text-sm ${x.id === vid ? "border-primary bg-secondary" : "bg-card"}`}>
                <span className="block font-semibold">{x.variant_name}</span>
                <span className="text-xs">{inr(x.price)}</span>
              </button>
            ))}
          </div>
          {v && (
            <div className="mt-6 rounded-2xl border bg-card p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{inr(v.price)}</span>
                {v.mrp && v.mrp > v.price && (
                  <>
                    <span className="text-muted-foreground line-through">MRP {inr(v.mrp)}</span>
                    <span className="rounded bg-accent px-1.5 text-xs font-bold text-accent-foreground">{Math.round(((v.mrp - v.price) / v.mrp) * 100)}% OFF</span>
                  </>
                )}
              </div>
              <p className={`mt-1 text-sm ${v.stock_quantity > 0 ? "text-primary" : "text-destructive"}`}>
                {v.stock_quantity > 0 ? (v.stock_quantity < 10 ? `Only ${v.stock_quantity} left` : "In stock") : "Out of stock"}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <QtyControl variantId={v.id} disabled={v.stock_quantity <= 0} onAdd={() => {
                  cart.add({ variantId: v.id, productId: p.id, slug: p.slug, productName: p.name, brand: p.brand, variantName: v.variant_name, price: v.price, mrp: v.mrp, stock: v.stock_quantity, icon });
                  toast.success("Added to cart");
                }} />
                {cart.qtyOf(v.id) > 0 && <Link to="/cart" className="text-sm font-semibold text-primary">Go to cart →</Link>}
              </div>
               <p className="mt-4 text-sm text-muted-foreground">Book now and pay at the counter on pickup.</p>
            </div>
          )}
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-bold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((r) => <ProductCard key={r.id} product={r} icon={productIcon(r, cats)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
