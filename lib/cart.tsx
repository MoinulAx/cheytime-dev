"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  /** 'music' items make Stripe create a customer, so downloads can be sent. */
  itemType: "merch" | "music";
  image?: string;
  meta?: string;
}

interface CartValue {
  items: CartItem[];
  /** False until localStorage has been read, so the count never flashes 0. */
  ready: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartValue | undefined>(undefined);

const STORAGE_KEY = "cheytime.cart.v1";
const MAX_QUANTITY = 99;

/** Anything malformed in storage is discarded rather than trusted. */
function parseStored(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((v) => {
      const i = v as Partial<CartItem>;
      if (typeof i?.id !== "string" || typeof i?.title !== "string") return [];
      if (typeof i?.price !== "number" || !Number.isFinite(i.price)) return [];
      const quantity = Math.min(
        Math.max(Math.trunc(Number(i.quantity) || 1), 1),
        MAX_QUANTITY,
      );
      return [
        {
          id: i.id,
          title: i.title,
          price: i.price,
          quantity,
          itemType: i.itemType === "music" ? "music" : "merch",
          image: typeof i.image === "string" ? i.image : undefined,
          meta: typeof i.meta === "string" ? i.meta : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
}

/**
 * The basket, kept in localStorage.
 *
 * The legacy cart lived in memory, so a reload emptied it. This survives one,
 * which is what the checkout-cancelled page promises, Stripe takes the buyer
 * off-site, and coming back to an empty basket after deciding not to pay is a
 * bad way to lose a sale.
 *
 * Nothing here is trusted for pricing. Prices are carried for display only;
 * `create-checkout-session` builds the Stripe line items from what it is sent,
 * and a real price check belongs there rather than in a browser store anyone
 * can edit. Worth closing before this takes live payments, see HANDOFF.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Read after mount: localStorage does not exist during the server render,
  // and seeding state from it directly would be a hydration mismatch.
  useEffect(() => {
    setItems(parseStored(window.localStorage.getItem(STORAGE_KEY)));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Private browsing, or the quota is full. The basket still works for
      // this page view; it just will not survive a reload.
    }
  }, [items, ready]);

  const add = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (!existing) return [...prev, { ...item, quantity }];
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QUANTITY) }
            : i,
        );
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    // Dropping to zero removes the line, which is what the stepper's minus
    // button should do at 1 rather than sticking.
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i,
      ),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      ready,
      add,
      remove,
      setQuantity,
      clear,
      totalItems: items.reduce((n, i) => n + i.quantity, 0),
      totalPrice: items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    [items, ready, add, remove, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
