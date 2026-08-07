"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/auth";
import { isWritableTable } from "@/lib/admin/schema";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Clear the public site's ISR cache.
 *
 * Without this an edit sits behind the 60s window even though we know exactly
 * when it happened — the whole point of moving the admin into this codebase.
 */
function revalidateSite() {
  revalidatePath("/");
  revalidatePath("/admin");
}

/** Strip empty strings to null so blank optional fields don't fail a cast. */
function clean(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    out[key] = typeof value === "string" && value.trim() === "" ? null : value;
  }
  return out;
}

/** Create (no id) or update (id) a row. */
export async function saveRecord(
  table: string,
  id: string | null,
  values: Record<string, unknown>,
): Promise<ActionResult> {
  // Both checks below also narrow `table` from the client-supplied string to a
  // known table name, which is what makes the `from(table)` calls type-safe.
  if (!isWritableTable(table)) return { ok: false, error: "Unknown table." };
  if (!(await getAdminUser()))
    return { ok: false, error: "Not signed in as an admin." };

  const db = await createClient();
  // The row shape is defined by lib/admin/schema.ts rather than by a literal
  // type here, so the generated per-table Insert/Update types cannot be applied.
  // RLS plus the column constraints are what actually validate the payload.
  const payload = clean(values) as never;

  const { error } = id
    ? await db.from(table).update(payload).eq("id", id)
    : await db.from(table).insert(payload);

  if (error) return { ok: false, error: error.message };

  revalidateSite();
  return { ok: true };
}

export async function deleteRecord(
  table: string,
  id: string,
): Promise<ActionResult> {
  if (!isWritableTable(table)) return { ok: false, error: "Unknown table." };
  if (!(await getAdminUser()))
    return { ok: false, error: "Not signed in as an admin." };

  const db = await createClient();
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateSite();
  return { ok: true };
}

/**
 * Server-side "is the current session an admin?".
 *
 * Exposed so the login form can report a non-admin account clearly instead of
 * bouncing the user back to the form with no explanation. The answer comes
 * from the same `admin-auth` edge function the guard uses — the browser never
 * decides this for itself.
 */
export async function isAdmin(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}

export async function signOut(): Promise<void> {
  const db = await createClient();
  await db.auth.signOut();
  revalidatePath("/admin");
}
