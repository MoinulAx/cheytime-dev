import type { Metadata } from "next";
import BackStack from "@/components/BackStack";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Cart",
  // A basket is per-browser and has nothing to index.
  robots: { index: false },
};

/**
 * The basket.
 *
 * The legacy site kept this in a right-hand drawer. Here it is a page, for the
 * same reason Journal and Gallery are pages: the clock owns the viewport and
 * already opens one overlay of its own, and a second sliding panel over the
 * first is how you end up with two close buttons and no idea which one you
 * are dismissing.
 */
export default function CartPage() {
  return (
    <>
      <BackStack href="/#store" label="Back to the clock" />
      <CartView />
    </>
  );
}
