import type { SectionData } from "@/types/section";
import { renderableImage } from "./images";
import { text, withSupabase } from "./utils";

type StoreData = Extract<SectionData, { kind: "store" }>;

/** Shown in place of `meta` when the admin left the material blank. */
const DEFAULT_MATERIAL = "Limited Release";

/** Keep prices tidy: whole numbers stay whole, the rest round to cents. */
const normalizePrice = (price: number): number =>
  Number.isFinite(price) ? Number(price.toFixed(2)) : 0;

/**
 * Store (VI), live from `merch_products`, newest first.
 *
 * `image_url` goes through `renderableImage()` like every other DB image: an
 * admin can paste any URL, and a host `next/image` does not recognise throws
 * during render and takes the whole page down with it. A dropped URL leaves
 * `image` undefined, and the tile falls back to its numbered placeholder.
 */
export async function loadStore(fallback: StoreData): Promise<StoreData> {
  const products = await withSupabase("loadStore", async (db) => {
    const { data, error } = await db
      .from("merch_products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      price: normalizePrice(row.price),
      material: text(row.meta) ?? DEFAULT_MATERIAL,
      image: renderableImage(text(row.image_url)),
    }));
  });

  if (!products || products.length === 0) return fallback;

  return {
    kind: "store",
    products,
    note: text(fallback.note),
  };
}
