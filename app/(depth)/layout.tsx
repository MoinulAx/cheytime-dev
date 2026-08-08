import type { ReactNode } from "react";
import PageShell from "@/components/PageShell";

/**
 * Shell for the one-level pages: Gallery, Music, Press.
 *
 * Wider than Journal because these are photographs and video players rather
 * than prose — a reading measure would waste the space. Journal keeps its own
 * layout for the narrower column its text needs.
 *
 * A route group, so the URLs stay /gallery, /music and /press.
 */
export default function DepthLayout({ children }: { children: ReactNode }) {
  return <PageShell wide>{children}</PageShell>;
}
