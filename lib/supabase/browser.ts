"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Browser Supabase client — used only by the Contact form, which inserts into
 * `contact_submissions`. That table's RLS grants INSERT to `anon` but SELECT
 * to admins only, so the form can post but nothing readable leaks client-side.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
