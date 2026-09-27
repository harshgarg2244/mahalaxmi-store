import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  productName: string;
  brand: string | null;
  variantName: string;
  price: number;
  mrp: number | null;
  stock: number;
  icon: string;
  qty: number;
};

type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  qtyOf: (variantId: string) => number;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "mahalaxmi-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const setQty = (variantId: string, qty: number) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) => (i.variantId === variantId ? { ...i, qty: Math.min(qty, i.stock) } : i)),
    );

  const value: Ctx = {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
    add: (item, qty = 1) =>
      setItems((prev) => {
        const ex = prev.find((i) => i.variantId === item.variantId);
        if (ex) return prev.map((i) => (i === ex ? { ...i, qty: Math.min(i.qty + qty, i.stock) } : i));
        return [...prev, { ...item, qty: Math.min(qty, item.stock) }];
      }),
    setQty,
    remove: (id) => setQty(id, 0),
    clear: () => setItems([]),
    qtyOf: (id) => items.find((i) => i.variantId === id)?.qty ?? 0,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

export const inr = (n: number) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
