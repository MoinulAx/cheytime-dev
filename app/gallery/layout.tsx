import type { ReactNode } from "react";
import PageShell from "@/components/PageShell";

/**
 * The archive gets the whole viewport.
 *
 * Deliberately outside the `(depth)` group, which caps its pages at
 * `max-w-5xl`. That cap is right for video and prose and wrong here: the
 * legacy gallery was full-bleed, and a masonry pinned to 1024px in the middle
 * of a 1920px monitor reads as a small grid marooned in the centre — which is
 * exactly what it looked like.
 */
export default function GalleryLayout({ children }: { children: ReactNode }) {
  return <PageShell bleed>{children}</PageShell>;
}
