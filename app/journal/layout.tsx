import type { ReactNode } from "react";
import PageShell from "@/components/PageShell";

/**
 * Journal shell — narrower than Gallery, Music and Press, because this is the
 * one page below the clock that is mostly prose and wants a reading measure.
 */
export default function JournalLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
