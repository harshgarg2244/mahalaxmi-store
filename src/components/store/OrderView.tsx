import { Check } from "lucide-react";
import { inr } from "@/lib/cart";

export type PublicOrder = {
  order_code: string; customer_name: string; customer_phone: string; address: string;
  landmark: string | null; subtotal: number; discount: number; total: number;
  payment_method: string; status: string; created_at: string;
  items: { product_name: string; brand: string | null; variant_name: string; quantity: number; unit_price: number; total_price: number }[];
};

const STEPS = ["Pending", "Confirmed", "Packed", "Ready for Pickup", "Picked Up"];

export function OrderView({ o }: { o: PublicOrder }) {
  const idx = STEPS.indexOf(o.status);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Order</p>
            <p className="font-display text-xl font-bold">{o.order_code}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${o.status === "Cancelled" ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary"}`}>{o.status}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Placed {new Date(o.created_at).toLocaleString("en-IN")}</p>
        {o.status !== "Cancelled" && (
          <ol className="mt-4 grid grid-cols-5 gap-1">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-col items-center text-center">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {i <= idx ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className="mt-1 text-[10px] leading-tight sm:text-xs">{s}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="rounded-2xl border bg-card p-4 text-sm">
        <p className="font-semibold">Pickup contact</p>
        <p>{o.customer_name} · {o.customer_phone}</p>
        <p className="text-muted-foreground">Collect from the store after the status changes to Ready for Pickup.</p>
      </div>
      <div className="rounded-2xl border bg-card p-4 text-sm">
        <ul className="space-y-2">
          {o.items.map((i, k) => (
            <li key={k} className="flex justify-between gap-2">
              <span>{i.product_name} <span className="text-muted-foreground">({i.variant_name}) × {i.quantity}</span></span>
              <span className="font-medium">{inr(i.total_price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{inr(o.total)}</span></div>
        <p className="mt-2 text-center font-semibold">Pay at the counter on pickup</p>
      </div>
    </div>
  );
}
