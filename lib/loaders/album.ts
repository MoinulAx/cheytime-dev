import type { Database } from "@/lib/supabase/database.types";
import type { AlbumRecord, AlbumTrack, SectionData } from "@/types/section";
import { text, withSupabase, yearOf } from "./utils";
import { renderableImage } from "./images";
import { streamableAudio } from "./audio";

/**
 * A record can live on a streaming service rather than in our bucket.
 *
 * `platform` is a free-text column, so this maps the values the admin offers
 * and falls back to the host name for anything typed by hand. Returns
 * undefined for a link we cannot send a visitor to, which keeps a malformed
 * row from rendering a dead button.
 */
const PLATFORM_LABELS: Record<string, string> = {
  apple_music: "Apple Music",
  itunes: "Apple Music",
  spotify: "Spotify",
  youtube: "YouTube",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
  tidal: "Tidal",
};

export function listenLink(
  platform: string | null | undefined,
  link: string | null | undefined,
): { url: string; label: string } | undefined {
  const url = text(link);
  if (!url || !url.startsWith("https://")) return undefined;
  const key = text(platform)?.toLowerCase();
  let name = key ? PLATFORM_LABELS[key] : undefined;
  if (!name) {
    try {
      name = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return undefined;
    }
  }
  return { url, label: `Listen on ${name}` };
}

type AlbumData = Extract<SectionData, { kind: "album" }>;

/**
 * Release types that group child tracks under one sleeve. A mixtape is an
 * album as far as this hour is concerned; the word is the only difference,
 * and the client thinks in mixtapes.
 */
export const isRecord = (releaseType: string | null | undefined): boolean =>
  releaseType === "album" || releaseType === "mixtape";
type ReleaseRow = Database["public"]["Tables"]["music_releases"]["Row"];

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
      if (row.parent_album_id || !isRecord(row.release_type)) continue;
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
      // A record with nothing playable is still worth showing when it streams
      // somewhere else: a mixtape released to Apple Music has no file for us
      // to host, and dropping it would leave the hour looking empty while the
      // record is out. With neither audio nor a link there is nothing to show.
      const link = listenLink(row.platform, row.platform_link);
      if (!tracks.some((t) => t.audioUrl) && !link) continue;
      records.push({
        id: row.id,
        title: text(row.title) ?? "Untitled",
        description: text(row.description),
        cover: renderableImage(text(row.artwork_url)),
        year: yearOf(row.created_at),
        tracks,
        link,
      });
    }

    for (const row of rows) {
      if (row.parent_album_id || isRecord(row.release_type)) continue;
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
