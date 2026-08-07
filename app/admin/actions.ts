"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminUser } from "@/lib/admin/auth";
import {
  ADMIN_TABLES,
  isWritableTable,
  type WritableTable,
} from "@/lib/admin/schema";

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

/**
 * Normalise a blank field to whatever its column actually accepts.
 *
 * Most text columns in this schema are `NOT NULL DEFAULT ''`, so blanking one
 * has to write `''` — writing `null` trips the not-null constraint and
 * surfaces to the admin as a raw database error. Only columns marked
 * `nullable` (uuid, date, timestamp) get `null`, because an empty string
 * cannot be cast to those types at all.
 *
 * Numbers fall back to 0: `price` and `sort_order` are both
 * `NOT NULL DEFAULT 0`, and a cleared number means zero here, not unknown.
 */
/**
 * Which column identifies a row. Almost always `id`, but `site_settings` is
 * keyed on `key` — filtering that by `id` matches nothing and the update
 * silently succeeds against zero rows.
 */
function primaryKeyOf(table: WritableTable): string {
  return ADMIN_TABLES.find((d) => d.table === table)?.primaryKey ?? "id";
}

function clean(
  table: WritableTable,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const fields = ADMIN_TABLES.find((d) => d.table === table)?.fields ?? [];
  const byKey = new Map(fields.map((f) => [f.key, f]));

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const field = byKey.get(key);
    const isBlank =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");

    if (!isBlank) {
      out[key] = value;
      continue;
    }
    if (field?.nullable) out[key] = null;
    else if (field?.type === "number") out[key] = 0;
    else if (field?.type === "boolean") out[key] = false;
    else if (field) out[key] = "";
    // Unknown keys (child-table columns) pass through untouched.
    else out[key] = value;
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
  const payload = clean(table, values) as never;
  const pk = primaryKeyOf(table);

  const { error } = id
    ? await db.from(table).update(payload).eq(pk, id)
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
  const { error } = await db.from(table).delete().eq(primaryKeyOf(table), id);
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
  // Guarded like every other entry point: an unconfigured environment must
  // land on the sign-in page, not throw out of a Server Action.
  if (isSupabaseConfigured) {
    try {
      const db = await createClient();
      await db.auth.signOut();
    } catch (error) {
      console.error("[admin] sign out failed", error);
    }
  }
  revalidatePath("/admin");
}
