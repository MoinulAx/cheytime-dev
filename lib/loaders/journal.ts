import type { JournalEntry, JournalPost } from "@/types/section";
import { text, withSupabase } from "./utils";
import { renderableImage } from "./images";
import { formatDateLabel } from "./blog";

/**
 * The Journal pages at `/journal` and `/journal/[slug]`.
 *
 * These read `blog_posts` directly rather than going through `getSections()`.
 * The clock panel only ever shows a preview, so loading full bodies into the
 * section config would ship every post's text inside the home page for content
 * nobody has opened. Here, the body is the point.
 *
 * There is no static fallback. A section on the clock must render something
 * even with Supabase unreachable; a route that exists only to display a
 * database row has nothing honest to show, so the caller renders an empty
 * state or a 404 instead of inventing a post.
 */

/** A row missing a slug cannot be linked to, so it cannot be listed. */
function toEntry(row: {
  id: string;
  slug: string | null;
  title: string | null;
  date: string | null;
  excerpt: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
}): JournalEntry | null {
  const slug = text(row.slug);
  if (!slug) return null;
  return {
    id: row.id,
    slug,
    title: text(row.title) ?? "Untitled",
    dateLabel: formatDateLabel(row.date),
    excerpt: text(row.excerpt) ?? "",
    thumbnail: renderableImage(text(row.thumbnail_url)),
    url: text(row.external_url),
  };
}

/** Every post, newest first. Empty when unreachable, never invented. */
export async function loadJournalEntries(): Promise<JournalEntry[]> {
  const entries = await withSupabase("loadJournalEntries", async (db) => {
    const { data, error } = await db
      .from("blog_posts")
      .select("*")
      // Same order as the Journal panel, so the page and the preview agree.
      .order("sort_order", { ascending: true })
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).flatMap((row) => {
      const entry = toEntry(row);
      return entry ? [entry] : [];
    });
  });

  return entries ?? [];
}

/**
 * One post by slug, or `null` when it does not exist, which the page turns
 * into a 404 rather than an empty article.
 *
 * The body is split on blank lines into paragraphs. `blog_posts.body` is plain
 * text, so it is rendered as text: no markdown parsing and no
 * `dangerouslySetInnerHTML`, because the column is admin-editable and treating
 * it as markup would make the admin an injection surface for the public site.
 */
export async function loadJournalPost(
  slug: string,
): Promise<JournalPost | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  const post = await withSupabase("loadJournalPost", async (db) => {
    const { data, error } = await db
      .from("blog_posts")
      .select("*")
      .eq("slug", trimmed)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const entry = toEntry(data);
    if (!entry) return null;

    const body = (text(data.body) ?? "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    return { ...entry, body };
  });

  return post ?? null;
}
