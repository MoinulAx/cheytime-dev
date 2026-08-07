import type { ArchiveItem, SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";
import { renderableImage } from "./images";

type ContactData = Extract<SectionData, { kind: "contact" }>;

/** Shown in place of `meta` when the admin left the caption blank. */
const DEFAULT_META = "The Archive";

/**
 * Contact (X) — the archive grid is live from `gallery_items`; the address,
 * blurb, SLA and channel list stay editorial and come from the static section.
 *
 * `gallery_items` can hold non-image media, and the archive grid only knows how
 * to draw a photograph — so anything else is filtered out here rather than
 * asking the renderer to cope with it.
 */
export async function loadArchive(fallback: ContactData): Promise<ContactData> {
  const archive = await withSupabase("loadArchive", async (db) => {
    const { data, error } = await db
      .from("gallery_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    const items: ArchiveItem[] = [];
    for (const row of data ?? []) {
      // Dropped rather than passed through: next/image throws on an
      // unconfigured host, and that throw would take down the whole page.
      const src = renderableImage(text(row.image_url));
      if (!src) continue;
      if (row.media_type && row.media_type !== "image") continue;
      items.push({
        alt: text(row.alt) ?? "Archive photograph",
        meta: text(row.meta) ?? DEFAULT_META,
        src,
      });
    }
    return items;
  });

  if (!archive || archive.length === 0) return fallback;

  return {
    kind: "contact",
    email: fallback.email,
    blurb: fallback.blurb,
    sla: fallback.sla,
    socials: fallback.socials,
    archive,
  };
}
