import type { ReactNode } from "react";

/**
 * The shell every page below the clock sits in.
 *
 * `body` sets `overflow: hidden` so the clock can own the viewport, which
 * would trap a page of content. This fixed, scrollable wrapper opts back out
 * without touching global CSS — the same approach `/admin` uses.
 *
 * Shared rather than copied per route: four identical layouts is how one of
 * them quietly ends up with different padding.
 */
export default function PageShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  /** Photographs and video want more width than prose does. */
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-void">
      <div
        className={[
          "mx-auto min-h-full w-full px-5 pb-24 md:px-8",
          wide ? "max-w-5xl" : "max-w-3xl",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
