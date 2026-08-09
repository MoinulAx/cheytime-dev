import type { ReactNode } from "react";
import PageShell from "@/components/PageShell";

/** Same shell as the checkout returns it leads into. */
export default function CartLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
