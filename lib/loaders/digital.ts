import type { SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";
import { renderableImage } from "./images";
import { downloadableAudio } from "./audio";

type DigitalData = Extract<SectionData, { kind: "digital" }>;

const normalizePrice = (price: number): number =>
  Number.isFinite(price) ? Number(price.toFixed(2)) : 0;

/**
 * Digital (VII), live from `music_products`, active only.
 *
 * `preview_audio_url` is exposed for every row. `audio_url`, the full track,
 * is exposed for one case and one case only: a row the client has explicitly
 * ticked as a free giveaway. Everywhere else it stays server-side, because it
 * is the thing being sold and putting it in the page source would hand it
 * away; paid delivery still runs through the `secure-download` edge function.
 *
 * The `is_free` check is the whole guard, so it is deliberately a single
 * expression with no other way to reach `row.audio_url` in this file. Note
 * that it is not `price === 0`: price defaults to zero and most rows already
 * sit at zero, so pricing could never have been the signal here.
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

    return (data ?? []).map((row) => {
      const title = text(row.title) ?? "Untitled";
      const free = row.is_free === true;
      return {
        id: row.id,
        title,
        artist: text(row.artist) ?? "Chey",
        price: normalizePrice(row.price),
        description: text(row.description),
        cover: renderableImage(text(row.cover_url)),
        previewUrl: text(row.preview_audio_url),
        free,
        downloadUrl: free ? downloadableAudio(row.audio_url, title) : undefined,
      };
    });
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
