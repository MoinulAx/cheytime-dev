import type { SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";

type BlogData = Extract<SectionData, { kind: "blog" }>;

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** `blog_posts.date` is a bare date — parse as UTC so it can't roll back a day. */
function formatDateLabel(date: string | null): string {
  if (!date) return "";
  const at = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date);
  return Number.isNaN(at.getTime()) ? "" : DATE_FORMAT.format(at);
}

/**
 * Blog (I) — live from `blog_posts`, newest first.
 *
 * This site has no per-post route, so a post is only a link when it carries an
 * `external_url`. Everything else renders as title, date and excerpt in the
 * panel. Linking to a `/blog/[slug]` that does not exist would be worse than
 * not linking at all — revisit if a detail route is ever added.
 */
export async function loadBlog(fallback: BlogData): Promise<BlogData> {
  const posts = await withSupabase("loadBlog", async (db) => {
    const { data, error } = await db
      .from("blog_posts")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      title: text(row.title) ?? "Untitled",
      dateLabel: formatDateLabel(row.date),
      excerpt: text(row.excerpt) ?? "",
      url: text(row.external_url),
      thumbnail: text(row.thumbnail_url),
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
