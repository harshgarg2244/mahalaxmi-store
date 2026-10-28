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
      { name: "description", content: "Enter your name and phone to book your grocery order for store pickup." },
      { property: "og:title", content: "Checkout — Mahalaxmi General Store" },
      { property: "og:description", content: "Book your grocery order for pickup in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const cart = useCart();
  const nav = useNavigate();
  const qc = useQueryClient();
  const notify = useServerFn(notifyNewOrder);
  const [f, setF] = useState({ name: "", phone: "", whatsapp: "", address: "", landmark: "" });
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
    const whatsapp = f.whatsapp.replace(/\D/g, "").slice(-10);
    if (f.name.trim().length < 2) { toast.error("Please enter your name."); return; }
    if (phone.length !== 10) { toast.error("Please enter a valid 10-digit phone number."); return; }
    if (f.whatsapp.trim() !== "" && whatsapp.length !== 10) { toast.error("Please enter a valid 10-digit WhatsApp number, or leave it empty."); return; }
    if (f.address.trim().length < 5) { toast.error("Please enter your address."); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("place_order", {
      p_name: f.name.trim().slice(0, 100),
      p_phone: phone,
      p_address: f.address.trim().slice(0, 300),
      p_landmark: f.landmark.trim().slice(0, 120),
      p_whatsapp: whatsapp.length === 10 ? whatsapp : null,
      p_items: cart.items.map((i) => ({ variant_id: i.variantId, quantity: i.qty })),
    });
    setBusy(false);
    if (error || !data) { toast.error(error?.message ?? "Could not place order. Please try again."); return; }
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
        <h1 className="text-2xl font-bold">Pickup details</h1>
        <p className="text-sm text-muted-foreground">No account needed. We’ll use your number to confirm when the order is ready.</p>
        <label className="block text-sm font-medium">Full name<input className={input} value={f.name} onChange={set("name")} maxLength={100} required /></label>
        <label className="block text-sm font-medium">Phone number<input className={input} value={f.phone} onChange={set("phone")} inputMode="numeric" placeholder="10-digit mobile" maxLength={14} required /></label>
        <label className="block text-sm font-medium">
          WhatsApp number <span className="text-xs text-muted-foreground">(optional)</span>
          <input className={input} value={f.whatsapp} onChange={set("whatsapp")} inputMode="numeric" placeholder="Same as phone if left empty" maxLength={14} />
        </label>
        <label className="block text-sm font-medium">Address<textarea className={input} rows={2} value={f.address} onChange={set("address")} placeholder="House / street / area" maxLength={300} required /></label>
        <label className="block text-sm font-medium">
          Landmark <span className="text-xs text-muted-foreground">(optional)</span>
          <input className={input} value={f.landmark} onChange={set("landmark")} maxLength={120} placeholder="Nearby shop, temple, etc." />
        </label>
        <div className="rounded-xl border-2 border-primary bg-secondary p-3">
          <p className="font-semibold">Pickup and payment</p>
          <p className="text-xs text-muted-foreground">Collect your packed order at the store and pay by cash or UPI at the counter.</p>
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
