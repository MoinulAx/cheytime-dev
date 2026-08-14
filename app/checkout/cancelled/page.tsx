import Link from "next/link";
import type { Metadata } from "next";
import BackStack from "@/components/BackStack";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false },
};

/** Stripe's cancel return, nothing was charged. */
export default function CheckoutCancelledPage() {
  return (
    <>
      <BackStack href="/#store" label="Back to the clock" />
      <div className="py-16">
        <p className="eyebrow mb-3">Chey Time</p>
        <h1 className="font-display text-5xl font-bold leading-none text-bone-50">
          Checkout cancelled.
        </h1>
        <p className="measure mt-6 font-sans text-[15px] leading-relaxed text-bone-200/90">
          Nothing was charged. Your basket is still there whenever you want to
          pick it back up.
        </p>
        <Link href="/#store" className="btn-editorial mt-8">
          Back to the store
        </Link>
      </div>
    </>
  );
}
