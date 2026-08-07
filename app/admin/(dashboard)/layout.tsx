import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/auth";

/**
 * The auth gate for every admin route.
 *
 * Lives on a route group so a page added here later is protected by default —
 * putting the check in each page is how one eventually ships without it. The
 * URL is unaffected: `(dashboard)/page.tsx` still serves `/admin`.
 *
 * This decides what renders. RLS decides what is permitted.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await getAdminUser())) redirect("/admin/login");
  return <>{children}</>;
}
