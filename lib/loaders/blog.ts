import type { SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";
import { renderableImage } from "./images";

type BlogData = Extract<SectionData, { kind: "blog" }>;

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * `blog_posts.date` is a free-text column, not a date type.
 *
 * The seeded rows use `2026.02.27`, the admin's date input produces
 * `2026-02-27`, and nothing stops someone typing "Spring 2026". So: normalise
 * the two known numeric shapes, parse as UTC to avoid rolling back a day, and
 * pass anything else through untouched rather than showing a blank or
 * "Invalid Date" where a date should be.
 */
export function formatDateLabel(date: string | null): string {
  const raw = date?.trim();
  if (!raw) return "";

  const numeric = raw.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (numeric) {
    const [, y, m, d] = numeric;
    const at = new Date(
      `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00Z`,
    );
    if (!Number.isNaN(at.getTime())) return DATE_FORMAT.format(at);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : DATE_FORMAT.format(parsed);
}

/**
 * Blog (I), live from `blog_posts`, newest first.
 *
 * The panel is a preview: title, date, excerpt. The full text lives at
 * `/journal/[slug]` (see `lib/loaders/journal.ts`), reached through the
 * panel's "See more" link, so `body` is deliberately not loaded here, it
 * would ride along in the home page's payload for content nobody has asked to
 * read yet. `url` still points at an external article where one exists.
 */
export async function loadBlog(fallback: BlogData): Promise<BlogData> {
  const posts = await withSupabase("loadBlog", async (db) => {
    const { data, error } = await db
      .from("blog_posts")
      .select("*")
      // Admin order first, newest-first as the tiebreak.
      .order("sort_order", { ascending: true })
      .order("date", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      title: text(row.title) ?? "Untitled",
      dateLabel: formatDateLabel(row.date),
      excerpt: text(row.excerpt) ?? "",
      url: text(row.external_url),
      thumbnail: renderableImage(text(row.thumbnail_url)),
    }));
  });

  if (!posts || posts.length === 0) return fallback;

  return {
    kind: "blog",
    description: fallback.description,
    posts,
    emptyMessage: fallback.emptyMessage,
  };
}
