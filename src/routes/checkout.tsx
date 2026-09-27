import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart, inr } from "@/lib/cart";
import { notifyNewOrder } from "@/lib/telegram.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Mahalaxmi General Store" },
      { name: "description", content: "Enter your name, phone and address to place your order. Pay on delivery." },
      { property: "og:title", content: "Checkout — Mahalaxmi General Store" },
      { property: "og:description", content: "Place your grocery order in seconds." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const cart = useCart();
  const nav = useNavigate();
  const qc = useQueryClient();
  const notify = useServerFn(notifyNewOrder);
  const [f, setF] = useState({ name: "", phone: "", address: "", landmark: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (cart.items.length === 0) {
    return (
      <div className="p-10 text-center">
        Your cart is empty. <Link to="/shop" search={{ q: "", cat: "" }} className="font-semibold text-primary">Shop now</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const phone = f.phone.replace(/\D/g, "").slice(-10);
    if (f.name.trim().length < 2) return toast.error("Please enter your name.");
    if (phone.length !== 10) return toast.error("Please enter a valid 10-digit phone number.");
    if (f.address.trim().length < 5) return toast.error("Please enter your full address.");
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      p_name: f.name.trim().slice(0, 100),
      p_phone: phone,
      p_address: f.address.trim().slice(0, 500),
      p_landmark: f.landmark.trim().slice(0, 200),
      p_items: cart.items.map((i) => ({ variant_id: i.variantId, quantity: i.qty })),
    });
    setBusy(false);
    if (error || !data) return toast.error(error?.message ?? "Could not place order. Please try again.");
    const code = (data as { order_code: string }).order_code;
    localStorage.setItem("mahalaxmi-last-order", JSON.stringify({ code, phone }));
    notify({ data: { code, phone } }).catch(() => {});
    cart.clear();
    qc.invalidateQueries({ queryKey: ["products"] });
    nav({ to: "/order/$code", params: { code }, search: { phone, new: true } });
  }

  const input = "mt-1 w-full rounded-xl border bg-card px-3 py-2.5 outline-none focus:border-primary";
  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-[1fr_320px]">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5">
        <h1 className="text-2xl font-bold">Delivery details</h1>
        <p className="text-sm text-muted-foreground">No account needed — just tell us where to deliver.</p>
        <label className="block text-sm font-medium">Full name<input className={input} value={f.name} onChange={set("name")} maxLength={100} required /></label>
        <label className="block text-sm font-medium">Phone number<input className={input} value={f.phone} onChange={set("phone")} inputMode="numeric" placeholder="10-digit mobile" maxLength={14} required /></label>
        <label className="block text-sm font-medium">Address<textarea className={input} rows={3} value={f.address} onChange={set("address")} maxLength={500} required /></label>
        <label className="block text-sm font-medium">Landmark (optional)<input className={input} value={f.landmark} onChange={set("landmark")} maxLength={200} /></label>
        <div className="rounded-xl border-2 border-primary bg-secondary p-3">
          <p className="font-semibold">💵 Pay at Counter / On Delivery</p>
          <p className="text-xs text-muted-foreground">Pay by cash or UPI when you receive your order. No online payment.</p>
        </div>
        <button disabled={busy} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60">
          {busy ? "Placing order…" : `Place order · ${inr(cart.subtotal)}`}
        </button>
      </form>
      <aside className="h-fit rounded-2xl border bg-card p-4">
        <h2 className="font-bold">Order summary</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {cart.items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-2">
              <span className="line-clamp-1">{i.productName} <span className="text-muted-foreground">({i.variantName}) × {i.qty}</span></span>
              <span className="shrink-0 font-medium">{inr(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{inr(cart.subtotal)}</span></div>
      </aside>
    </div>
  );
}
