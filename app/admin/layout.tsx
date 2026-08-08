import type { ReactNode } from "react";

/**
 * Every `/admin/*` route is rendered per request, never prerendered.
 *
 * These routes read cookies, so in practice they already opt out of static
 * rendering — but only as a side effect, and that is too thin a thread to hang
 * an authenticated surface on. Two ways it snaps:
 *
 *   • `getAdminUser()` returns early when Supabase env is missing, before it
 *     ever touches `cookies()`. Nothing dynamic is read, so Next prerenders
 *     `/admin` — and because `NEXT_PUBLIC_*` is inlined at build time, a
 *     production build without env bakes a redirect-to-login into the route
 *     and keeps serving it after env is fixed. Every admin is locked out.
 *   • Any future path that decides "not an admin" before reading the session
 *     reintroduces the same hole silently.
 *
 * Declaring it here covers the whole subtree, including `/admin/login`, per
 * ADMIN_PLAN.md §3.1. This is the opposite of `revalidate`, which must never
 * appear on these routes.
 */
export const dynamic = "force-dynamic";

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
