"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import MediaImage from "./MediaImage";
import { useCart, type CartItem } from "@/lib/cart";
import { startCheckout } from "@/lib/checkout";

/** Whole dollars unless the row actually carries cents. */
function money(n: number) {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

export default function CartView() {
  const { items, ready, remove, setQuantity, clear, totalItems, totalPrice } =
    useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const checkout = async () => {
    setBusy(true);
    setError(null);
    // One session for the whole basket, rather than the per-product checkout
    // the Store buttons used to fire. The edge function takes an array.
    const result = await startCheckout(
      items.map((i) => ({
        id: i.id,
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        itemType: i.itemType,
      })),
    );
    // Only reached on failure — success is a full navigation to Stripe.
    setBusy(false);
    setError(result.error);
  };

  // Storage has not been read yet. Showing "empty" here and then swapping to a
  // full basket a frame later is worse than showing nothing for that frame.
  if (!ready) {
    return (
      <div className="py-16">
        <p className="eyebrow mb-3">Chey Time</p>
        <h1 className="font-display text-5xl font-bold leading-none text-bone-50">
          Cart
        </h1>
        <div className="rule mt-8" />
        <div className="mt-8 space-y-4" aria-hidden="true">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse border border-bone-100/10 bg-bone-100/[0.03] motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <p className="eyebrow mb-3">Chey Time</p>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-5xl font-bold leading-none text-bone-50">
          Cart
        </h1>
        {totalItems > 0 && (
          <span className="font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
            {totalItems} item{totalItems === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="rule mt-8" />

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-2xl italic text-bone-300">
            Nothing in here yet.
          </p>
          <p className="mx-auto mt-3 max-w-xs font-sans text-sm leading-relaxed text-bone-300/80">
            Merch lives on the Store hour and downloads on the Digital hour.
          </p>
          <Link href="/#store" className="btn-editorial mt-8">
            Go to the store
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-8">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  layout={!reduce}
                  initial={false}
                  exit={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, height: 0, marginTop: 0 }
                  }
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden border-b border-bone-100/10"
                >
                  <Line
                    item={item}
                    onRemove={() => remove(item.id)}
                    onQuantity={(q) => setQuantity(item.id, q)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="mt-8 flex items-baseline justify-between">
            <p className="eyebrow">Total</p>
            <p className="font-display text-3xl font-bold text-bone-50">
              {money(totalPrice)}
            </p>
          </div>
          <p className="mt-2 text-right font-sans text-[11px] leading-relaxed text-bone-500">
            Shipping and any tax are worked out on the next screen.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-6 border border-cosmic-400/40 px-4 py-3 font-sans text-[12px] leading-relaxed text-cosmic-400"
            >
              {error}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={checkout}
              disabled={busy}
              className="border border-bone-50 bg-bone-50 px-6 py-3 font-sans text-[11px] uppercase tracking-wide2 text-void transition-colors hover:bg-transparent hover:text-bone-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100 disabled:opacity-40"
            >
              {busy ? "Opening Stripe…" : "Checkout →"}
            </button>
            <Link href="/#store" className="btn-editorial">
              Keep shopping
            </Link>
            <button
              type="button"
              onClick={clear}
              className="font-sans text-[10px] uppercase tracking-wide2 text-bone-500 underline-offset-4 transition-colors hover:text-bone-200 hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100 sm:ml-auto"
            >
              Empty cart
            </button>
          </div>

          <p className="measure mt-10 font-sans text-[11px] leading-relaxed text-bone-500">
            Payment is handled by Stripe on their own page. Card details never
            touch this site.
          </p>
        </>
      )}
    </div>
  );
}

function Line({
  item,
  onRemove,
  onQuantity,
}: {
  item: CartItem;
  onRemove: () => void;
  onQuantity: (quantity: number) => void;
}) {
  return (
    <div className="flex gap-4 py-5">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-bone-100/10 bg-void-800">
        {item.image ? (
          <MediaImage
            src={item.image}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display text-2xl italic text-bone-100/15">
            {item.itemType === "music" ? "♪" : "—"}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-sans text-[14px] leading-tight text-bone-100">
              {item.title}
            </p>
            <p className="mt-1 font-sans text-[10px] uppercase tracking-wide2 text-bone-500">
              {item.meta ? `${item.meta} · ` : ""}
              {item.itemType === "music" ? "Download" : "Merch"}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.title}`}
            className="-mr-1 shrink-0 px-1 font-sans text-[11px] text-bone-500 transition-colors hover:text-bone-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Step
              label={`Decrease quantity of ${item.title}`}
              onClick={() => onQuantity(item.quantity - 1)}
            >
              −
            </Step>
            {/* Text, not an input: a number field on a two-item basket invites
                typing 0 or 1e9 and needing to defend against both. */}
            <span
              aria-live="polite"
              className="w-8 text-center font-sans text-[13px] tabular-nums text-bone-100"
            >
              {item.quantity}
            </span>
            <Step
              label={`Increase quantity of ${item.title}`}
              onClick={() => onQuantity(item.quantity + 1)}
            >
              +
            </Step>
          </div>
          <p className="font-display text-lg italic text-bone-50">
            {money(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Step({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center border border-bone-100/20 font-sans text-sm text-bone-200 transition-colors hover:border-bone-100 hover:bg-bone-50 hover:text-void focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
    >
      {children}
    </button>
  );
}
