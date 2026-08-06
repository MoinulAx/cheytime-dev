import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Read-only client for public content under ISR.
 *
 * Deliberately does NOT touch `cookies()`. Reading cookies opts a route out of
 * static rendering entirely, which would turn `revalidate = 60` into
 * render-on-demand and cost us the fast first paint the clock needs. Every
 * table the loaders read is public-SELECT under RLS, so there is no session to
 * carry — an empty cookie adapter is the correct shape, not a workaround.
 */
export function createStaticClient() {
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}

/**
 * Cookie-aware server client, for when this site grows an authenticated
 * surface (an admin route, a per-user view). Anything rendered through this
 * becomes dynamic by definition, so keep it out of the ISR content path —
 * the loaders use `createStaticClient` instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component / static render — safe to ignore.
          // Session refresh is handled by middleware once auth exists.
        }
      },
    },
  });
}
