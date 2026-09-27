import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, inr } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Mahalaxmi General Store" },
      { name: "description", content: "Review items in your cart before placing your order." },
      { property: "og:title", content: "Your Cart — Mahalaxmi General Store" },
      { property: "og:description", content: "Review your grocery order." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const savings = cart.items.reduce((s, i) => s + (i.mrp && i.mrp > i.price ? (i.mrp - i.price) * i.qty : 0), 0);

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-14 w-14 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-muted-foreground">Add some groceries to get started.</p>
        <Link to="/shop" search={{ q: "", cat: "" }} className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="mb-4 text-2xl font-bold">Cart ({cart.count} items)</h1>
        <div className="divide-y rounded-2xl border bg-card">
          {cart.items.map((i) => (
            <div key={i.variantId} className="flex items-center gap-3 p-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl">{i.icon}</div>
              <div className="min-w-0 flex-1">
                <Link to="/product/$slug" params={{ slug: i.slug }} className="line-clamp-1 font-semibold">{i.productName}</Link>
                <p className="text-xs text-muted-foreground">{i.variantName} · {inr(i.price)}</p>
                <p className="text-sm font-bold">{inr(i.price * i.qty)}</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border">
                <button aria-label="Decrease" onClick={() => cart.setQty(i.variantId, i.qty - 1)} className="p-1.5"><Minus className="h-4 w-4" /></button>
                <span className="w-5 text-center text-sm font-bold">{i.qty}</span>
                <button aria-label="Increase" disabled={i.qty >= i.stock} onClick={() => cart.setQty(i.variantId, i.qty + 1)} className="p-1.5 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
              </div>
              <button aria-label="Remove" onClick={() => cart.remove(i.variantId)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
      <aside className="h-fit rounded-2xl border bg-card p-4 md:sticky md:top-24">
        <h2 className="font-bold">Bill summary</h2>
        <div className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Items total</span><span>{inr(cart.subtotal)}</span></div>
          {savings > 0 && <div className="flex justify-between text-primary"><span>You save</span><span>{inr(savings)}</span></div>}
          <div className="flex justify-between"><span>Delivery</span><span className="text-primary">Free</span></div>
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold"><span>To pay</span><span>{inr(cart.subtotal)}</span></div>
        </div>
        <p className="mt-3 rounded-lg bg-accent/40 p-2 text-center text-sm font-semibold">💵 Pay at Counter / On Delivery</p>
        <Link to="/checkout" className="mt-3 block rounded-xl bg-primary py-3 text-center font-bold text-primary-foreground">Proceed to checkout</Link>
      </aside>
    </div>
  );
}
