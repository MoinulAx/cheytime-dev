"use client";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

/** One line on the Stripe checkout — matches the edge function's payload. */
export interface CheckoutItem {
  title: string;
  /** Dollars. The function converts to cents itself. */
  price: number;
  quantity: number;
  /** 'music' makes Stripe create a customer, so downloads can be delivered. */
  itemType?: "merch" | "music";
}

/**
 * Start a Stripe checkout.
 *
 * Stripe lives entirely in the `create-checkout-session` edge function, which
 * is already deployed against this project and already used by the legacy
 * store. This site does not hold the secret key, build line items, or talk to
 * Stripe — it posts a cart and follows the URL it gets back. The
 * `stripe-webhook` function marks the purchase paid, so nothing here has to.
 *
 * The function declares `verify_jwt = false`, so the anon key is the only
 * credential needed.
 *
 * Returns an error string rather than throwing: a failed checkout has to show
 * the shopper something, and an unhandled rejection in an onClick shows
 * nothing at all.
 */
export async function startCheckout(
  items: CheckoutItem[],
): Promise<{ error: string } | never> {
  if (!isSupabaseConfigured) {
    return { error: "Checkout is not configured." };
  }
  if (items.length === 0) return { error: "Nothing to check out." };

  const origin = window.location.origin;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          items,
          successUrl: `${origin}/checkout/success`,
          cancelUrl: `${origin}/checkout/cancelled`,
        }),
      },
    );

    const body = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !body.url) {
      return { error: body.error ?? "Could not start checkout." };
    }

    // Stripe's hosted page is a different origin, so a full navigation rather
    // than a router push. `replace` so the browser's back button returns to
    // the site rather than bouncing through a spent session.
    window.location.replace(body.url);
    // Navigation has started; nothing after this runs.
    return new Promise<never>(() => {});
  } catch {
    return { error: "Could not reach checkout. Please try again." };
  }
}
