import type { Database } from "@/lib/supabase/database.types";
import type { AlbumRecord, AlbumTrack, SectionData } from "@/types/section";
import { text, withSupabase, yearOf } from "./utils";
import { renderableImage } from "./images";

type AlbumData = Extract<SectionData, { kind: "album" }>;
type ReleaseRow = Database["public"]["Tables"]["music_releases"]["Row"];

/**
 * Only public Storage URLs are streamable from the browser.
 *
 * A signed URL would expire and leave a dead player on a cached page, and a
 * non-https URL is blocked as mixed content. Anything else is dropped so the
 * track still lists, just without a player, rather than rendering a control
 * that silently fails.
 */
function streamableAudio(url: string | null | undefined): string | undefined {
  const value = text(url);
  if (!value) return undefined;
  if (!value.startsWith("https://")) return undefined;
  if (value.includes("/storage/v1/object/sign/")) return undefined;
  if (value.includes("token=")) return undefined;
  return value;
}

const toTrack = (row: ReleaseRow): AlbumTrack => ({
  id: row.id,
  title: text(row.title) ?? "Untitled",
  audioUrl: streamableAudio(row.audio_url),
  description: text(row.description),
  artwork: renderableImage(text(row.artwork_url)),
});

/**
 * Album (III), the record, streamed in full from `music_releases`.
 *
 * The table is a shallow tree: an album is a row with `release_type = 'album'`
 * and no parent, and its tracks hang off it via `parent_album_id`. Hour IV
 * (Music) flattens that same tree into YouTube embeds; this hour reads the
 * other column, `audio_url`, the file uploaded through the admin, and plays
 * it.
 *
 * Standalone rows that carry audio but belong to no album are kept as
 * single-track entries. Otherwise uploading a track without first creating an
 * album parent would put a file in the bucket that never appears anywhere,
 * which is a confusing way for the admin to seem broken.
 *
 * Rows with no audio at all are skipped: this hour is the audio hour, and an
 * album listed here with nothing playable is worse than one absence.
 */
export async function loadAlbum(fallback: AlbumData): Promise<AlbumData> {
  const albums = await withSupabase("loadAlbum", async (db) => {
    const { data, error } = await db
      .from("music_releases")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    const rows = data ?? [];

    const children = new Map<string, ReleaseRow[]>();
    for (const row of rows) {
      if (!row.parent_album_id) continue;
      const list = children.get(row.parent_album_id);
      if (list) list.push(row);
      else children.set(row.parent_album_id, [row]);
    }

    const records: AlbumRecord[] = [];

    for (const row of rows) {
      if (row.parent_album_id || row.release_type !== "album") continue;
      const tracks = (children.get(row.id) ?? []).map(toTrack);
      // An album row can carry its own file too, a single-file record, or the
      // full mix alongside the split tracks.
      const own = streamableAudio(row.audio_url);
      if (own) {
        tracks.unshift({
          id: `${row.id}-full`,
          title: text(row.title) ?? "Untitled",
          audioUrl: own,
        });
      }
      if (!tracks.some((t) => t.audioUrl)) continue;
      records.push({
        id: row.id,
        title: text(row.title) ?? "Untitled",
        description: text(row.description),
        cover: renderableImage(text(row.artwork_url)),
        year: yearOf(row.created_at),
        tracks,
      });
    }

    for (const row of rows) {
      if (row.parent_album_id || row.release_type === "album") continue;
      if (!streamableAudio(row.audio_url)) continue;
      records.push({
        id: row.id,
        title: text(row.title) ?? "Untitled",
        description: text(row.description),
        cover: renderableImage(text(row.artwork_url)),
        year: yearOf(row.created_at),
        tracks: [toTrack(row)],
      });
    }

    return records;
  });

  if (!albums || albums.length === 0) return fallback;

  return {
    kind: "album",
    description: fallback.description,
    albums,
    emptyMessage: fallback.emptyMessage,
  };
}
