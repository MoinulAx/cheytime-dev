/**
 * Supabase connection values, read once and validated.
 *
 * Both clients point at the SAME project the legacy admin app writes to
 * (`enhduflezmiugpjaovhz`), so a content edit in the old repo's Admin panel is
 * visible here within one ISR window. The anon/publishable key is safe to ship
 * to the browser, every table this site reads is protected by the RLS policies
 * defined in the legacy repo's `supabase/migrations/*.sql` (public SELECT on
 * published content, admin-only writes).
 */

/** Project URL, e.g. https://enhduflezmiugpjaovhz.supabase.co */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Anon ("publishable") key, public by design, gated by RLS. */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * `true` when both values are present. Loaders check this and fall back to the
 * static config rather than throwing, so a missing `.env.local` degrades to the
 * hard-coded content instead of taking the whole site down.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
