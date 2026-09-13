import { ADMIN_TABLES, type TableDef, type WritableTable } from "./schema";

/**
 * How the fifteen tables are grouped in the sidebar.
 *
 * The old navigation was one wrapping row of fifteen equal buttons: nothing
 * was findable because nothing was ranked. Grouping answers "where do I go to
 * change X?" before the label has to.
 *
 * The order here is deliberate and not alphabetical. Site comes first because
 * it is the furniture every hour sits in; Content is the daily work and is
 * therefore the largest; Commerce and Messages are visited on their own
 * occasions rather than while editing the site.
 *
 * `groupedTables()` is the only way this is read, and it asserts every table
 * lands somewhere, so adding a table to `ADMIN_TABLES` without listing it
 * here is caught by a test rather than by a client noticing a tab is gone.
 */
export interface NavGroup {
  id: string;
  label: string;
  tables: readonly WritableTable[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "site",
    label: "Site",
    tables: ["site_sections", "site_settings", "about_credits", "social_links"],
  },
  {
    id: "content",
    label: "Content",
    tables: [
      "music_releases",
      "upcoming_releases",
      "events",
      "gallery_items",
      "press_features",
      "blog_posts",
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    tables: ["merch_products", "music_products", "purchases"],
  },
  {
    id: "messages",
    label: "Messages",
    tables: ["contact_submissions", "outreach_logs"],
  },
] as const;

export interface ResolvedGroup {
  id: string;
  label: string;
  tables: TableDef[];
}

/**
 * The groups with their table definitions attached.
 *
 * Throws rather than quietly dropping anything: a table listed here but absent
 * from the schema, or present in the schema and in no group, both mean part of
 * the admin has become unreachable, which is exactly the sort of thing that
 * ships unnoticed.
 */
export function groupedTables(defs: TableDef[] = ADMIN_TABLES): ResolvedGroup[] {
  const byTable = new Map(defs.map((d) => [d.table, d]));
  const seen = new Set<string>();

  const groups = NAV_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    tables: group.tables.map((name) => {
      const def = byTable.get(name);
      if (!def) throw new Error(`Nav lists "${name}", which is not an admin table.`);
      if (seen.has(name)) throw new Error(`"${name}" appears in more than one nav group.`);
      seen.add(name);
      return def;
    }),
  }));

  const orphans = defs.filter((d) => !seen.has(d.table)).map((d) => d.table);
  if (orphans.length > 0) {
    throw new Error(
      `These tables are in no nav group and would be unreachable: ${orphans.join(", ")}`,
    );
  }
  return groups;
}
