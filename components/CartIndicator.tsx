"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/lib/cart";

/**
 * The basket affordance, pinned top-right.
 *
 * Only rendered once something is in it. A permanent shopping icon on the dial
 * would be a storefront chrome bolted onto a piece that is meant to read as an
 * object; showing it the moment there is something to buy keeps the clock
 * clean and still means a basket is never lost.
 *
 * Bottom-right rather than the legacy top-right: the open hour puts its Close
 * control in that corner, and two round-ish targets a few pixels apart is how
 * you get someone dismissing the panel when they meant to check out. Down here
 * it clears every control on the page, and above the panel (z-[60]) so the
 * basket stays reachable with an hour open.
 */
export default function CartIndicator() {
  const { totalItems, ready } = useCart();
  const pathname = usePathname();
  const reduce = useReducedMotion();

  // Nothing to return to on the cart itself, and the admin is not a storefront.
  const hidden =
    !ready ||
    totalItems === 0 ||
    pathname === "/cart" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout");

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          className="fixed bottom-4 right-4 z-[60] md:bottom-6 md:right-6"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.25 }}
        >
          <Link
            href="/cart"
            aria-label={`Cart, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
            className="group relative flex h-11 w-11 items-center justify-center border border-bone-100/25 bg-void/85 text-bone-200 backdrop-blur-sm transition-colors hover:border-bone-100 hover:text-bone-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-bone-100"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center border border-bone-100/25 bg-bone-50 px-1 font-sans text-[9px] font-semibold tabular-nums text-void">
              {totalItems}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
