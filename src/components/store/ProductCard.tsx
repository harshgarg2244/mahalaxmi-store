import { Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useCart, inr } from "@/lib/cart";
import type { Product } from "@/lib/store";
import { ProductVisual } from "@/components/store/ProductVisual";
import { Button } from "@/components/ui/button";

export function QtyControl({ variantId, onAdd, disabled }: { variantId: string; onAdd: () => void; disabled?: boolean }) {
  const cart = useCart();
  const q = cart.qtyOf(variantId);
  if (disabled) {
    return <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">Out of stock</span>;
  }
  if (q === 0) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="border-2 border-primary bg-secondary font-bold text-primary hover:bg-primary hover:text-primary-foreground"
      >
        ADD
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-primary px-1.5 py-1 text-primary-foreground">
      <Button type="button" variant="ghost" size="icon" aria-label="Decrease" onClick={() => cart.setQty(variantId, q - 1)} className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"><Minus className="h-4 w-4" /></Button>
      <span className="min-w-4 text-center text-sm font-bold">{q}</span>
      <Button type="button" variant="ghost" size="icon" aria-label="Increase" onClick={() => cart.setQty(variantId, q + 1)} className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"><Plus className="h-4 w-4" /></Button>
    </div>
  );
}

export function ProductCard({ product, icon }: { product: Product; icon: string }) {
  const cart = useCart();
  const variants = product.product_variants.filter((v) => v.is_available);
  const [vid, setVid] = useState(variants[0]?.id);
  const v = variants.find((x) => x.id === vid) ?? variants[0];
  if (!v) return null;
  const off = v.mrp && v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;

  return (
    <article className="relative flex flex-col rounded-lg border bg-card p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {off > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
          {off}% OFF
        </span>
      )}
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <div className="mb-3 aspect-square overflow-hidden rounded-md bg-secondary">
          <ProductVisual src={product.image_url} name={product.name} category={product.categories?.name} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
        </div>
        {product.brand && <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</p>}
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-tight">{product.name}</h3>
      </Link>
      {variants.length > 1 ? (
        <select
          value={v.id}
          onChange={(e) => setVid(e.target.value)}
          className="mt-2 w-full rounded-md border bg-background px-2 py-1 text-xs"
          aria-label="Choose size"
        >
          {variants.map((x) => (
            <option key={x.id} value={x.id}>{x.variant_name} — {inr(x.price)}</option>
          ))}
        </select>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{v.variant_name}</p>
      )}
      <div className="mt-auto flex items-center justify-between pt-3">
        <div>
          <p className="text-sm font-bold">{inr(v.price)}</p>
           {off > 0 && v.mrp !== null && <p className="text-[11px] text-muted-foreground line-through">{inr(v.mrp)}</p>}
        </div>
        <QtyControl
          variantId={v.id}
          disabled={v.stock_quantity <= 0}
          onAdd={() =>
            cart.add({
              variantId: v.id,
              productId: product.id,
              slug: product.slug,
              productName: product.name,
              brand: product.brand,
              variantName: v.variant_name,
              price: v.price,
              mrp: v.mrp,
              stock: v.stock_quantity,
              icon,
            })
          }
        />
      </div>
    </article>
  );
}
