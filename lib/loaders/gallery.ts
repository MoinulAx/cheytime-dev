import type { GalleryImage, SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";
import { renderableImage } from "./images";

type GalleryData = Extract<SectionData, { kind: "gallery" }>;

/**
 * Gallery (IX) — every photograph, from `gallery_items`.
 *
 * There used to be four views of this one table: chapters on III, V and IX,
 * plus a grid inside Contact. They were the same photographs sliced up, so
 * they are now a single section and there is no `collection` filter — the
 * column still exists but nothing reads it.
 *
 * Non-image media and unusable URLs are dropped here rather than in the
 * renderer: the grid only knows how to draw a photograph, and an
 * off-allowlist src would throw during render.
 */
export async function loadGallery(fallback: GalleryData): Promise<GalleryData> {
  const images = await withSupabase("loadGallery", async (db) => {
    const { data, error } = await db
      .from("gallery_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    const out: GalleryImage[] = [];
    for (const row of data ?? []) {
      const src = renderableImage(text(row.image_url));
      if (!src) continue;
      if (row.media_type && row.media_type !== "image") continue;
      out.push({
        src,
        alt: text(row.alt) ?? "Chey — photograph",
        meta: text(row.meta),
      });
    }
    return out;
  });

  if (!images || images.length === 0) return fallback;

  return { kind: "gallery", description: fallback.description, images };
}
