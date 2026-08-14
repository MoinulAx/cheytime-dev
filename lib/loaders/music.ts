import type { Database } from "@/lib/supabase/database.types";
import type { MusicVideo, SectionData } from "@/types/section";
import { text, withSupabase, yearOf, youtubeIdFrom } from "./utils";

type MusicData = Extract<SectionData, { kind: "music" }>;
type ReleaseRow = Database["public"]["Tables"]["music_releases"]["Row"];
type LinkRow = Database["public"]["Tables"]["music_links"]["Row"];

/**
 * Flatten `music_releases` into the panel's single ordered video list.
 *
 * The table is a shallow tree, albums are rows with `release_type = 'album'`
 * and no parent, tracks hang off an album via `parent_album_id`. The panel
 * renders one flat list, so we walk album-then-children and finish with the
 * standalone singles, which keeps an album's tracks together on screen.
 * Anything that isn't YouTube-embeddable is dropped (see `youtubeIdFrom`).
 */
function fromReleases(rows: ReleaseRow[]): MusicVideo[] {
  const children = new Map<string, ReleaseRow[]>();
  for (const row of rows) {
    if (!row.parent_album_id) continue;
    const list = children.get(row.parent_album_id);
    if (list) list.push(row);
    else children.set(row.parent_album_id, [row]);
  }

  const videos: MusicVideo[] = [];
  const seen = new Set<string>();

  const push = (row: ReleaseRow, note?: string) => {
    if (seen.has(row.id)) return;
    const youtubeId = youtubeIdFrom(row.platform_link);
    if (!youtubeId) return;
    seen.add(row.id);
    videos.push({
      id: row.id,
      title: row.title,
      youtubeId,
      // `created_at` is the only date the table carries, treat it as the
      // release year until a dedicated column exists.
      year: yearOf(row.created_at),
      note,
    });
  };

  for (const album of rows) {
    if (album.parent_album_id || album.release_type !== "album") continue;
    push(album, "Album");
    for (const track of children.get(album.id) ?? []) {
      push(track, `From ${album.title}`);
    }
  }

  for (const row of rows) {
    if (row.parent_album_id) continue;
    push(row);
  }

  // Tracks whose parent album row is missing or unreadable still deserve a slot.
  for (const row of rows) push(row);

  return videos;
}

/** Older YouTube-only rows, already one embeddable id per record. */
function fromLinks(rows: LinkRow[]): MusicVideo[] {
  const videos: MusicVideo[] = [];
  for (const row of rows) {
    const youtubeId = youtubeIdFrom(row.youtube_id);
    if (!youtubeId) continue;
    videos.push({
      id: row.id,
      title: row.title,
      youtubeId,
      year: yearOf(row.created_at),
    });
  }
  return videos;
}

/**
 * Music (IV), live from `music_releases`, falling back to the legacy
 * `music_links` table and finally to the static config.
 *
 * `channelLabel` / `channelUrl` / `note` are editorial and have no DB column,
 * so they come from the static section and are preserved verbatim.
 */
export async function loadMusic(fallback: MusicData): Promise<MusicData> {
  const videos = await withSupabase("loadMusic", async (db) => {
    const { data, error } = await db
      .from("music_releases")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    const fromTable = fromReleases(data ?? []);
    if (fromTable.length > 0) return fromTable;

    const { data: links, error: linkError } = await db
      .from("music_links")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (linkError) throw linkError;

    return fromLinks(links ?? []);
  });

  if (!videos || videos.length === 0) return fallback;

  return {
    kind: "music",
    channelLabel: fallback.channelLabel,
    channelUrl: fallback.channelUrl,
    videos,
    note: text(fallback.note),
  };
}
