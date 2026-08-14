import type { Database } from "@/lib/supabase/database.types";
import type { SectionData, UpcomingRelease } from "@/types/section";
import { text, withSupabase, youtubeIdFrom } from "./utils";
import { renderableImage } from "./images";

type UpcomingData = Extract<SectionData, { kind: "upcoming" }>;
type Row = Database["public"]["Tables"]["upcoming_releases"]["Row"];

/** Formatted on the server so the client never re-formats a date. */
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  // `release_date` is a bare DATE. Reading it in the server's local zone can
  // land on the previous evening and print the day before.
  timeZone: "UTC",
});

function dateLabelOf(value: string | null): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return DATE_FORMAT.format(parsed);
}

/**
 * What the badge says.
 *
 * `status` is the editor's intent and wins, except that a date in the past
 * makes "coming soon" a lie, a release that shipped last month should not
 * still be teasing. That correction only ever moves a row forward to "Out
 * now"; it never un-releases anything.
 */
function statusOf(
  status: string,
  releaseDate: string | null,
): { label: string; released: boolean } {
  const raw = (text(status) ?? "announced").toLowerCase();
  const date = text(releaseDate);
  const isPast = date
    ? new Date(`${date}T00:00:00Z`).getTime() <= Date.now()
    : false;

  if (raw === "out" || isPast) return { label: "Out now", released: true };
  if (raw === "preorder") return { label: "Pre-save", released: false };
  return { label: date ? "Coming soon" : "Announced", released: false };
}

/** Only a real, browser-followable link. */
function linkOf(url: string | null): string | undefined {
  const value = text(url);
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : undefined;
}

/**
 * Upcoming (I), announcements, from `upcoming_releases`.
 *
 * Deliberately not derived from `music_releases`. That table is catalogue and
 * needs a thing to exist before it can show it; this hour is for what does not
 * exist yet, which is why the date is nullable and the link is optional. A row
 * with nothing but a title still renders, as an announcement, which is the
 * point.
 */
export async function loadUpcoming(
  fallback: UpcomingData,
): Promise<UpcomingData> {
  const releases = await withSupabase("loadUpcoming", async (db) => {
    const { data, error } = await db
      .from("upcoming_releases")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("release_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;

    const out: UpcomingRelease[] = [];
    for (const row of (data ?? []) as Row[]) {
      const title = text(row.title);
      const artwork = renderableImage(text(row.artwork_url));
      const youtubeId = youtubeIdFrom(row.video_url) ?? undefined;
      // A title is not required when there is something to look at: a video
      // with a status badge is a complete announcement, and a name nobody has
      // typed yet should not make the row vanish. With no title *and* no
      // media there is nothing to render, so that row is still skipped.
      if (!title && !artwork && !youtubeId) continue;
      const { label, released } = statusOf(row.status, row.release_date);
      const url = linkOf(row.link_url);
      out.push({
        id: row.id,
        title: title ?? "",
        dateLabel: dateLabelOf(row.release_date),
        statusLabel: label,
        released,
        description: text(row.description),
        artwork,
        // A video wins over the still: the announcement is the teaser.
        youtubeId,
        url,
        linkLabel: url ? (text(row.link_label) ?? (released ? "Listen" : "Pre-save")) : undefined,
      });
    }
    return out;
  });

  if (!releases || releases.length === 0) return fallback;

  return {
    kind: "upcoming",
    description: fallback.description,
    releases,
    emptyMessage: fallback.emptyMessage,
  };
}
