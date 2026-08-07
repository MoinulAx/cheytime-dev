import type { ReactNode } from "react";

/**
 * Admin shell — chrome only, no auth.
 *
 * The gate lives in `(dashboard)/layout.tsx` so it wraps every real admin
 * route while leaving `/admin/login` reachable. Requiring a session to render
 * the sign-in form would lock everyone out.
 *
 * `body` sets `overflow: hidden` for the clock, which would trap this content —
 * the fixed, scrollable wrapper opts back out without touching global CSS.
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
