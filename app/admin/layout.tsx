import type { ReactNode } from "react";

/**
 * Admin shell.
 *
 * `body` sets `overflow: hidden` for the clock, which would trap the admin's
 * content — this fixed, scrollable wrapper opts back out without touching the
 * global stylesheet.
 *
 * Every route below here reads cookies and is therefore dynamic by nature.
 * Never add `revalidate` to an admin route: caching an authenticated page
 * risks serving one admin's view to the next visitor.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-void">
      <div className="mx-auto min-h-full w-full max-w-6xl px-5 py-8 md:px-8">
        {children}
      </div>
    </div>
  );
}
