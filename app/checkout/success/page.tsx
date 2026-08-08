import Link from "next/link";
import type { Metadata } from "next";
import BackStack from "@/components/BackStack";

export const metadata: Metadata = {
  title: "Order complete",
  robots: { index: false },
};

/**
 * Stripe's success return.
 *
 * Deliberately says nothing about the order. This page is reached by
 * redirect, not by proof of payment — anyone can open the URL — so it must
 * not confirm anything it has not verified. The `stripe-webhook` function is
 * what actually marks the purchase paid, and the receipt email is Stripe's.
 */
export default function CheckoutSuccessPage() {
  return (
    <>
      <BackStack href="/#store" label="Back to the clock" />
      <div className="py-16">
        <p className="eyebrow mb-3">Chey Time</p>
        <h1 className="font-display text-5xl font-bold leading-none text-bone-50">
          Thank you.
        </h1>
        <p className="measure mt-6 font-sans text-[15px] leading-relaxed text-bone-200/90">
          Your payment went through Stripe and a receipt is on its way to the
          email you gave them. Digital purchases arrive as a download link in
          that same email.
        </p>
        <p className="measure mt-4 font-sans text-[13px] leading-relaxed text-bone-400">
          Nothing arrived after a few minutes? Reply to the receipt, or use the
          Contact hour and we&apos;ll sort it.
        </p>
        <Link href="/#store" className="btn-editorial mt-8">
          Back to the store
        </Link>
      </div>
    </>
  );
}
