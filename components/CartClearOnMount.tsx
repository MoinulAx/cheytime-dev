"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/**
 * Empties the basket once Stripe has sent the buyer to the success return.
 *
 * Waits for `ready`. Effects run child-first, so clearing on mount would be
 * undone a moment later when the provider finishes reading localStorage and
 * puts the old basket back.
 *
 * Renders nothing.
 */
export default function CartClearOnMount() {
  const { clear, ready } = useCart();

  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);

  return null;
}
