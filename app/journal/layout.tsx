import type { ReactNode } from "react";

/**
 * Journal shell.
 *
 * `body` sets `overflow: hidden` so the clock can own the viewport, which
 * would trap a page of prose. The fixed, scrollable wrapper opts back out
 * without touching global CSS — the same approach `/admin` uses.
 */
export default function JournalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-void">
      <div className="mx-auto min-h-full w-full max-w-3xl px-5 pb-24 md:px-8">
        {children}
      </div>
    </div>
  );
}
