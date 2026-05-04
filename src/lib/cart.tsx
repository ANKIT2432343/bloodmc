import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  category: "rank" | "tag";
  price_inr: number;
  price_usd: number;
  color?: string | null;
};

type Currency = "INR" | "USD";

type CartCtx = {
  items: CartItem[];
  currency: Currency;
  setCurrency: (c: Currency) => void;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
  symbol: string;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<Currency>("INR");

  useEffect(() => {
    try {
      const s = localStorage.getItem("bloodmc_cart");
      if (s) setItems(JSON.parse(s));
      const c = localStorage.getItem("bloodmc_currency");
      if (c === "USD" || c === "INR") setCurrency(c);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("bloodmc_cart", JSON.stringify(items)); } catch {}
  }, [items]);

  useEffect(() => {
    try { localStorage.setItem("bloodmc_currency", currency); } catch {}
  }, [currency]);

  const add = (item: CartItem) => {
    setItems((prev) => prev.find((p) => p.id === item.id) ? prev : [...prev, item]);
  };
  const remove = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id));
  const clear = () => setItems([]);
  const total = items.reduce((s, it) => s + (currency === "INR" ? Number(it.price_inr) : Number(it.price_usd)), 0);
  const symbol = currency === "INR" ? "₹" : "$";

  return (
    <Ctx.Provider value={{ items, currency, setCurrency, add, remove, clear, count: items.length, total, symbol }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}

export function formatPrice(n: number, currency: Currency) {
  return currency === "INR" ? `₹${n.toLocaleString("en-IN")}` : `$${n.toFixed(2)}`;
}