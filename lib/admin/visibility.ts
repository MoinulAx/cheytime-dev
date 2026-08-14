import type { WritableTable } from "./schema";

/**
 * Why a row will not show up on the site.
 *
 * Every loader quietly drops rows it cannot render: an image on a host
 * `next/image` is not configured for, an event dated in the past, a track with
 * no YouTube link. The row saves without complaint and then simply never
 * appears, which from the client's side looks like the site is broken rather
 * than like the row needs another field.
 *
 * These checks mirror the loaders exactly, so a warning here means the row
 * really will be dropped, and no warning means it really will render. They
 * warn rather than block: a half-filled row being saved to come back to later
 * is normal, and refusing the save would be worse than explaining it.
 *
 * Keep in step with:
 *   images   -> lib/loaders/images.ts
 *   events   -> lib/loaders/events.ts   (.gte on date_time)
 *   music    -> lib/loaders/music.ts    (youtubeIdFrom)
 *   album    -> lib/loaders/album.ts    (streamableAudio)
 *   gallery  -> lib/loaders/gallery.ts  (media_type + renderableImage)
 *   upcoming -> lib/loaders/upcoming.ts (title or media)
 */
export interface Warning {
  /** Field this belongs under, or undefined for a whole-row warning. */
  field?: string;
  message: string;
}

const str = (v: unknown): string =>
  typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();

/**
 * Will `next/image` draw this URL?
 *
 * Same allowlist as `renderableImage` and `next.config.ts`. A local path is
 * assumed fine; the loader does its own existence check at build time.
 */
export function imageWillRender(raw: string): boolean {
  const value = raw.trim();
  if (!value) return true; // blank is not an error, just no image
  if (value.startsWith("/")) return true;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname;
  if (host === "i.ytimg.com" || host === "img.youtube.com") return true;
  if (/\.supabase\.co$/.test(host)) {
    return url.pathname.startsWith("/storage/v1/object/public/");
  }
  return false;
}

const IMAGE_ADVICE =
  "This image will not appear on the site. Use the Upload button below, which puts the file somewhere the site can read it. Pasted links only work from Supabase Storage or a YouTube thumbnail.";

/** Same parser as `youtubeIdFrom`, reduced to a yes or no. */
function hasYouTubeId(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (/^[\w-]{11}$/.test(value)) return true;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return /^[\w-]{11}$/.test(url.pathname.split("/").filter(Boolean)[0] ?? "");
  if (host !== "youtube.com" && host !== "m.youtube.com") return false;
  const v = url.searchParams.get("v");
  if (v && /^[\w-]{11}$/.test(v)) return true;
  return /^\/(?:embed|shorts|v|live)\/[\w-]{11}/.test(url.pathname);
}

/** Same rule as `streamableAudio` in the album loader. */
function audioWillStream(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  if (!value.startsWith("https://")) return false;
  if (value.includes("/storage/v1/object/sign/")) return false;
  return !value.includes("token=");
}

/** Every reason this row will not show, in the order the fields appear. */
export function warningsFor(
  table: WritableTable,
  row: Record<string, unknown>,
): Warning[] {
  const out: Warning[] = [];
  const has = (k: string) => str(row[k]).length > 0;

  // Any image field, on any table.
  for (const key of ["image_url", "artwork_url", "cover_url", "thumbnail_url"]) {
    const v = str(row[key]);
    if (v && !imageWillRender(v)) out.push({ field: key, message: IMAGE_ADVICE });
  }

  switch (table) {
    case "events": {
      const when = str(row.date_time);
      if (!when) {
        out.push({ field: "date_time", message: "An event with no date cannot be saved." });
      } else if (new Date(when).getTime() < Date.now()) {
        out.push({
          field: "date_time",
          message:
            "This date has already passed, so the event will not appear on the Events hour. Past dates drop off on their own, which is intended, but check the year if you meant this to be upcoming.",
        });
      }
      if (row.published === false) {
        out.push({ field: "published", message: "Unpublished, so this will not appear on the site." });
      }
      break;
    }

    case "music_releases": {
      const yt = hasYouTubeId(str(row.platform_link));
      const audio = audioWillStream(str(row.audio_url));
      // The specific reason first. Telling someone who just pasted a Spotify
      // link that the row "needs a link" is technically true and useless.
      if (!yt && str(row.platform_link)) {
        out.push({
          field: "platform_link",
          message:
            "This is not a YouTube link the site can embed, so the row will not appear on the Music hour. Spotify and Apple links are stored but cannot be played here.",
        });
      }
      if (!yt && !audio) {
        out.push({
          message:
            "This row will not appear anywhere yet. Add a YouTube link to put it on the Music hour, or upload audio to put it on the Album hour. A row can do both.",
        });
      }
      break;
    }

    case "gallery_items": {
      if (!has("image_url")) {
        out.push({ field: "image_url", message: "Without an image or a link, this row shows nothing." });
      } else if (str(row.media_type) !== "image" && imageWillRender(str(row.image_url))) {
        out.push({
          field: "media_type",
          message:
            "Media type is not “image”, so this is treated as a link rather than a photograph. Set it to “image” to show the picture.",
        });
      }
      break;
    }

    case "upcoming_releases": {
      if (!has("title") && !has("video_url") && !has("artwork_url")) {
        out.push({
          message:
            "A row needs a title, a video or a poster before it appears. With none of the three there is nothing to draw.",
        });
      }
      if (has("video_url") && !hasYouTubeId(str(row.video_url))) {
        out.push({
          field: "video_url",
          message: "This is not a YouTube link the site can play, so the poster will be used instead.",
        });
      }
      if (row.published === false) {
        out.push({ field: "published", message: "Unpublished, so this will not appear on the site." });
      }
      break;
    }

    case "merch_products":
      if (row.active === false) {
        out.push({ field: "active", message: "Not active, so this will not appear in the Store." });
      }
      break;

    case "music_products": {
      if (row.active === false) {
        out.push({ field: "active", message: "Not active, so this will not appear on the Digital hour." });
      }
      if (!has("preview_audio_url")) {
        out.push({
          field: "preview_audio_url",
          message: "Without a preview clip this row shows its text only, with nothing to play.",
        });
      }
      break;
    }

    case "press_features":
      if (row.published === false) {
        out.push({ field: "published", message: "Unpublished, so this will not appear on the Press hour." });
      }
      break;

    case "blog_posts":
      if (!has("slug")) {
        out.push({ field: "slug", message: "A post with no slug has no page of its own at /journal." });
      }
      break;
  }

  return out;
}
