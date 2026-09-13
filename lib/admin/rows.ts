import type { TableDef } from "./schema";

/**
 * What a row shows in the list, worked out from its table definition.
 *
 * The old list printed the same hardcoded scan of seven possible columns for
 * every table, so a gallery row and a purchase were rendered by the same
 * guesswork and most rows showed an empty second line. Reading the field
 * definitions instead means each table shows what it actually has, and a
 * table added later needs no change here.
 */

const str = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v).trim();

/** First image field on the table, used for the row thumbnail. */
export function thumbnailKey(def: TableDef): string | undefined {
  return def.fields.find((f) => f.type === "image")?.key;
}

export interface Badge {
  label: string;
  /** `warn` reads as "this is not live", `note` is neutral information. */
  tone: "warn" | "note" | "accent";
}

/**
 * Small status flags. Only states worth interrupting a scan for: whether the
 * row is live, and the handful of flags that change what it does.
 */
export function badgesFor(def: TableDef, row: Record<string, unknown>): Badge[] {
  const out: Badge[] = [];
  const has = (k: string) => def.fields.some((f) => f.key === k);

  if (has("active") && row.active === false) out.push({ label: "Inactive", tone: "warn" });
  if (has("published") && row.published === false) out.push({ label: "Draft", tone: "warn" });
  if (has("is_free") && row.is_free === true) out.push({ label: "Free", tone: "accent" });
  if (def.table === "contact_submissions" && !row.read)
    out.push({ label: "Unread", tone: "accent" });

  const type = str(row.release_type);
  if (type && type !== "track") out.push({ label: type, tone: "note" });

  return out;
}

/**
 * The row's second line: a few identifying details, in a fixed order so the
 * eye can scan down a column rather than re-reading each row.
 */
export function metaFor(def: TableDef, row: Record<string, unknown>): string {
  const has = (k: string) => def.fields.some((f) => f.key === k);
  const parts: string[] = [];

  for (const key of ["outlet", "artist", "email", "location", "slug", "role"]) {
    if (has(key) && str(row[key])) parts.push(str(row[key]));
  }
  // Purchases are read-only and carry no field definitions for these, but the
  // columns are what identifies the row, so they are read directly.
  if (def.readOnly) {
    for (const key of ["email", "amount", "status"]) {
      const v = str(row[key]);
      if (v && !parts.includes(v)) parts.push(v);
    }
  }
  if (has("price") && row.price !== null && row.price !== undefined) {
    parts.push(Number(row.price) === 0 ? "Free" : `$${str(row.price)}`);
  }
  return parts.filter(Boolean).join(" · ");
}
