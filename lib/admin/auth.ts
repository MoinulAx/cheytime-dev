import { createClient } from "@/lib/supabase/server";
import { isFrameworkSignal } from "@/lib/next-signals";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export interface AdminUser {
  id: string;
  email: string | null;
}

/**
 * Ask the deployed `admin-auth` edge function whether this user is an admin.
 *
 * The function verifies the JWT and then reads `user_roles` with the service
 * role, so the answer does not depend on what the caller is allowed to see.
 * That makes it the authoritative check, and it is shared with the legacy
 * admin — one definition of "is an admin" for both apps.
 *
 * Returns `true`/`false` when the function answers, and `null` when it cannot
 * be reached, so the caller can distinguish "denied" from "unavailable".
 */
async function askAdminAuth(accessToken: string): Promise<boolean | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "login-check" }),
      cache: "no-store",
    });

    if (response.ok) {
      const body = (await response.json()) as { admin?: boolean };
      return body.admin === true;
    }
    // The function ran and said no.
    if (response.status === 401 || response.status === 403) return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * The signed-in admin, or `null`.
 *
 * Authoritative check is the `admin-auth` edge function above. If it cannot be
 * reached we fall back to reading `user_roles` directly under the user's own
 * session — the table's RLS lets a user read their own roles, so this is a
 * genuine check rather than a bypass, just one that depends on that policy
 * staying in place.
 *
 * Either way this only decides what to render. Every table's RLS independently
 * gates writes behind `has_role(auth.uid(), 'admin')`.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  // Without this guard `createServerClient` throws "supabaseUrl is required"
  // on empty env, and because nothing here catches it the whole /admin route
  // 500s instead of showing the sign-in page. The public site never hit this:
  // its loaders all check the same flag before touching Supabase.
  if (!isSupabaseConfigured) {
    console.error(
      "[admin] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are " +
        "missing from this environment — nobody can sign in until they are set.",
    );
    return null;
  }

  try {
    const db = await createClient();

    // getUser() validates the JWT with the auth server; getSession() does not.
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) return null;

    const {
      data: { session },
    } = await db.auth.getSession();

    const viaFunction = session?.access_token
      ? await askAdminAuth(session.access_token)
      : null;

    if (viaFunction === true) return { id: user.id, email: user.email ?? null };
    if (viaFunction === false) return null;

    const { data: roles, error } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (error || !roles || roles.length === 0) return null;
    return { id: user.id, email: user.email ?? null };
  } catch (error) {
    // Next's own control flow must not be caught here — swallowing the
    // bail-out signal lets it believe an authenticated route is cacheable.
    if (isFrameworkSignal(error)) throw error;
    // Anything else is treated as "not an admin" rather than allowed to
    // escape: a failure here should land on the sign-in page, never a 500.
    console.error("[admin] admin check failed", error);
    return null;
  }
}
