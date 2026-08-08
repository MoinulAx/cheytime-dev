import type { ReactNode } from "react";
import PageShell from "@/components/PageShell";

/** Where Stripe returns the buyer. Same shell as the other pages. */
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
