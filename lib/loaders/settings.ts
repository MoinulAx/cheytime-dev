import { withSupabase } from "./utils";

export type SiteSettings = Record<string, string>;

/**
 * Every row of `site_settings` as a plain key → value map.
 *
 * Loaded once per render and passed to the loaders that need it, rather than
 * each one querying for its own two keys. Returns `{}` when unavailable, so
 * callers fall through to their static copy key by key.
 */
export async function loadSettings(): Promise<SiteSettings> {
  const settings = await withSupabase("loadSettings", async (db) => {
    const { data, error } = await db.from("site_settings").select("key, value");
    if (error) throw error;

    const map: SiteSettings = {};
    for (const row of data ?? []) {
      const value = row.value?.trim();
      // A blank value means "not set", let the static copy win rather than
      // rendering an empty line where a sentence should be.
      if (value) map[row.key] = value;
    }
    return map;
  });

  return settings ?? {};
}

/** Read a setting, falling back to the compiled-in copy. */
export const setting = (
  settings: SiteSettings,
  key: string,
  fallback: string,
): string => settings[key] ?? fallback;
