import type { GalleryImage, GalleryLink, SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";
import { renderableImage } from "./images";

type GalleryData = Extract<SectionData, { kind: "gallery" }>;

/**
 * Describe an off-site archive URL, or `undefined` if it is not usable.
 *
 * Only https is accepted — anything else is a typo or a stale value, and a
 * dead card is worse than a dropped row. Instagram is named explicitly because
 * that is what the archive actually holds and because `/p/` and `/reel/` say
 * what the link opens; everything else falls back to its hostname, so a
 * TikTok or YouTube link pasted later still gets a sensible label.
 */
function describeLink(raw: string): Omit<GalleryLink, "title" | "meta"> | undefined {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;

  const host = url.hostname.replace(/^www\./, "");

  if (host === "instagram.com") {
    const segment = url.pathname.split("/").filter(Boolean)[0];
    return {
      url: raw,
      platform: "Instagram",
      kind: segment === "reel" ? "Reel" : segment === "p" ? "Post" : undefined,
    };
  }

  return { url: raw, platform: host };
}

/**
 * Gallery (IX) — every archive entry, from `gallery_items`.
 *
 * There used to be four views of this one table: chapters on III, V and IX,
 * plus a grid inside Contact. They were the same photographs sliced up, so
 * they are now a single section and there is no `collection` filter — the
 * column still exists but nothing reads it.
 *
 * The table mixes two kinds of row under one `image_url` column: photographs,
 * and Instagram permalinks for appearances that were only ever posted there.
 * Both are sorted here rather than in the renderer — the grid only knows how
 * to draw a photograph, and an off-allowlist src would throw during render and
 * take the whole page with it. A permalink now becomes a link card instead of
 * being dropped, which is how seven rows went missing from the page.
 */
export async function loadGallery(fallback: GalleryData): Promise<GalleryData> {
  const entries = await withSupabase("loadGallery", async (db) => {
    const { data, error } = await db
      .from("gallery_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    const images: GalleryImage[] = [];
    const links: GalleryLink[] = [];

    for (const row of data ?? []) {
      const raw = text(row.image_url);
      if (!raw) continue;

      // Only an image-typed row is a candidate for the photo grid; anything
      // else falls through to the link branch rather than being discarded.
      const isImageRow = !row.media_type || row.media_type === "image";
      const src = isImageRow ? renderableImage(raw) : undefined;
      const title = text(row.alt) ?? "Chey — photograph";
      const meta = text(row.meta);

      if (src) {
        images.push({ src, alt: title, meta });
        continue;
      }

      const described = describeLink(raw);
      if (!described) continue;

      // On these rows `meta` is a type marker ("instagram"), not a caption —
      // the legacy gallery keyed its embed off it. Passing it straight
      // through renders "Instagram · Reel · Instagram", so drop it when it
      // only repeats the platform we already derived from the URL.
      const metaRepeatsPlatform =
        !!meta && meta.trim().toLowerCase() === described.platform.toLowerCase();

      links.push({
        ...described,
        title,
        meta: metaRepeatsPlatform ? undefined : meta,
      });
    }

    return { images, links };
  });

  if (!entries || (entries.images.length === 0 && entries.links.length === 0)) {
    return fallback;
  }

  return {
    kind: "gallery",
    description: fallback.description,
    images: entries.images,
    links: entries.links.length > 0 ? entries.links : undefined,
  };
}
