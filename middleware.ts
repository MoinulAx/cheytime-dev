import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * Only the admin runs through auth. The public site is anon-only and served
 * from the ISR cache — putting it through middleware would add a hop to every
 * request for no benefit.
 */
export const config = {
  matcher: ["/admin/:path*"],
};
