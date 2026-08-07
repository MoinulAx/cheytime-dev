import type { GalleryImage, SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";
import { renderableImage } from "./images";

type GalleryData = Extract<SectionData, { kind: "gallery" }>;

/**
 * A gallery chapter — live from `gallery_items` filtered to one `collection`.
 *
 * The same table backs the Contact archive (`collection = 'archive'`), so the
 * filter is what keeps the chapters and the archive from bleeding into each
 * other. Non-image media is dropped: this grid only knows how to draw a
 * photograph.
 */
export async function loadGallery(
  collection: string,
  fallback: GalleryData,
): Promise<GalleryData> {
  const images = await withSupabase(`loadGallery(${collection})`, async (db) => {
    const { data, error } = await db
      .from("gallery_items")
      .select("*")
      .eq("collection", collection)
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
