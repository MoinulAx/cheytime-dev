import { createClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string | null;
}

/**
 * The signed-in admin, or `null`.
 *
 * Mirrors the legacy admin's check: a valid session plus a row in `user_roles`
 * with `role = 'admin'`. Treat the result as UX only — it decides what to
 * render, not what is permitted. Every table's RLS independently gates writes
 * behind `has_role(auth.uid(), 'admin')`, so a forged client cannot write even
 * if it renders the whole panel.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const db = await createClient();

  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;

  const { data: roles, error } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin");

  if (error || !roles || roles.length === 0) return null;

  return { id: user.id, email: user.email ?? null };
}
