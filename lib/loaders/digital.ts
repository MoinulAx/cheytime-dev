import type { SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";
import { renderableImage } from "./images";

type DigitalData = Extract<SectionData, { kind: "digital" }>;

const normalizePrice = (price: number): number =>
  Number.isFinite(price) ? Number(price.toFixed(2)) : 0;

/**
 * Digital (VII) — live from `music_products`, active only.
 *
 * Only `preview_audio_url` is exposed. `audio_url` is the full track and is
 * deliberately never sent to the browser: it is released through the
 * `secure-download` edge function after purchase, and putting it in the page
 * source would hand away the thing being sold.
 */
export async function loadDigital(fallback: DigitalData): Promise<DigitalData> {
  const releases = await withSupabase("loadDigital", async (db) => {
    const { data, error } = await db
      .from("music_products")
      .select("*")
      .eq("active", true)
      // Admin order first, newest-first as the tiebreak.
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      title: text(row.title) ?? "Untitled",
      artist: text(row.artist) ?? "Chey",
      price: normalizePrice(row.price),
      description: text(row.description),
      cover: renderableImage(text(row.cover_url)),
      previewUrl: text(row.preview_audio_url),
    }));
  });

  if (!releases || releases.length === 0) return fallback;

  return {
    kind: "digital",
    description: fallback.description,
    releases,
    note: text(fallback.note),
    emptyMessage: fallback.emptyMessage,
  };
}
