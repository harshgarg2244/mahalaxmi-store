import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, LayoutGrid, Package, Search, ShoppingCart, Store } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCart, inr } from "@/lib/cart";
import { settingsQuery } from "@/lib/store";

function SearchBox({ className = "" }: { className?: string }) {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  return (
    <form
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        nav({ to: "/shop", search: { q: q.trim(), cat: "" } });
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search atta, daal, soap, masala…"
        className="w-full rounded-xl border bg-muted py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:bg-card"
      />
    </form>
  );
}

export function StoreLayout({ children }: { children: ReactNode }) {
  const cart = useCart();
  const { data: s } = useQuery(settingsQuery);
  const linkCls = "text-sm font-medium text-muted-foreground hover:text-foreground";
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Store className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-bold">{s?.store_name ?? "Mahalaxmi General Store"}</span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">{s?.tagline ?? "Your Everyday Grocery Store"}</span>
            </span>
          </Link>
          <SearchBox className="hidden flex-1 md:block" />
          <nav className="ml-auto hidden items-center gap-5 md:flex">
            <Link to="/categories" className={linkCls} activeProps={{ className: "text-primary" }}>Categories</Link>
            <Link to="/orders" className={linkCls} activeProps={{ className: "text-primary" }}>Track Order</Link>
            <Link to="/cart" className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              <ShoppingCart className="h-4 w-4" />
              {cart.count > 0 ? `${cart.count} · ${inr(cart.subtotal)}` : "Cart"}
            </Link>
          </nav>
        </div>
        <div className="px-4 pb-3 md:hidden"><SearchBox /></div>
      </header>

      <main>{children}</main>

      <footer className="mt-12 border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="font-display text-base font-bold text-foreground">{s?.store_name}</p>
            <p>{s?.address}</p>
          </div>
          <div><p className="font-semibold text-foreground">Hours</p><p>{s?.opening_hours}</p></div>
          <div><p className="font-semibold text-foreground">Call / WhatsApp</p><p>{s?.phone}</p>
            <Link to="/auth" className="mt-2 inline-block text-xs underline">Owner login</Link></div>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card md:hidden">
        {[
          { to: "/", label: "Home", Icon: Home },
          { to: "/categories", label: "Categories", Icon: LayoutGrid },
          { to: "/cart", label: "Cart", Icon: ShoppingCart },
          { to: "/orders", label: "Orders", Icon: Package },
        ].map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <Icon className="h-5 w-5" />
            {label}
            {to === "/cart" && cart.count > 0 && (
              <span className="absolute right-1/4 top-1 rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">{cart.count}</span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
