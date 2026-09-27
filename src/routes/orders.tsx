import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Mahalaxmi General Store" },
      { name: "description", content: "Enter your order code and phone number to see your order status." },
      { property: "og:title", content: "Track Your Order — Mahalaxmi General Store" },
      { property: "og:description", content: "Check your grocery order status anytime." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [last, setLast] = useState<{ code: string; phone: string } | null>(null);
  useEffect(() => {
    try { const r = localStorage.getItem("mahalaxmi-last-order"); if (r) setLast(JSON.parse(r)); } catch {}
  }, []);

  const input = "mt-1 w-full rounded-xl border bg-card px-3 py-2.5 outline-none focus:border-primary";
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-bold">Track your order</h1>
      <p className="text-sm text-muted-foreground">Enter the order code you got after checkout.</p>
      {last && (
        <Link to="/order/$code" params={{ code: last.code }} search={{ phone: last.phone, new: undefined }}
          className="mt-4 block rounded-2xl border-2 border-primary bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Your last order</p>
          <p className="font-display text-lg font-bold">{last.code}</p>
        </Link>
      )}
      <form
        className="mt-5 space-y-3 rounded-2xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const p = phone.replace(/\D/g, "").slice(-10);
          if (!code.trim() || p.length !== 10) { toast.error("Enter order code and 10-digit phone."); return; }
          nav({ to: "/order/$code", params: { code: code.trim().toUpperCase() }, search: { phone: p, new: undefined } });
        }}
      >
        <label className="block text-sm font-medium">Order code<input className={input} value={code} onChange={(e) => setCode(e.target.value)} placeholder="GR-2026-XXXXXX" maxLength={30} /></label>
        <label className="block text-sm font-medium">Phone number<input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" maxLength={14} /></label>
        <button className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground">Find order</button>
      </form>
    </div>
  );
}
