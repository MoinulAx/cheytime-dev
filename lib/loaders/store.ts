import type { SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";

type StoreData = Extract<SectionData, { kind: "store" }>;

/** Shown in place of `meta` when the admin left the material blank. */
const DEFAULT_MATERIAL = "Limited Release";

/** Keep prices tidy: whole numbers stay whole, the rest round to cents. */
const normalizePrice = (price: number): number =>
  Number.isFinite(price) ? Number(price.toFixed(2)) : 0;

/**
 * Store (VI) — live from `merch_products`, newest first.
 *
 * The table also carries `image_url`, but `Product` has no image field and the
 * renderer draws its own numbered placeholder tile. Rather than widen the
 * union we ignore the column here; wiring product photography is a follow-up
 * that touches the renderer and is out of scope for this pass.
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
    }));
  });

  if (!products || products.length === 0) return fallback;

  return {
    kind: "store",
    products,
    note: text(fallback.note),
  };
}
