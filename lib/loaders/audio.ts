import { text } from "./utils";

/**
 * Only public Storage URLs are playable from the browser.
 *
 * A signed URL would expire and leave a dead player on a cached page, and a
 * non-https URL is blocked as mixed content. Anything else is dropped so the
 * track still lists, just without a player, rather than rendering a control
 * that silently fails.
 *
 * Lives here rather than in one loader because two hours now depend on the
 * same rule: Album (III) streams whatever passes this, and Digital (VII)
 * offers whatever passes it as a free download. One copy means the two hours
 * cannot drift into disagreeing about which files are usable.
 */
export function streamableAudio(url: string | null | undefined): string | undefined {
  const value = text(url);
  if (!value) return undefined;
  if (!value.startsWith("https://")) return undefined;
  if (value.includes("/storage/v1/object/sign/")) return undefined;
  if (value.includes("token=")) return undefined;
  return value;
}

/** Filename a browser should save a track under, derived from its title. */
function downloadName(title: string, url: string): string {
  const ext = (url.split("?")[0]?.match(/\.([a-z0-9]{2,4})$/i)?.[1] ?? "mp3").toLowerCase();
  const stem =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "track";
  return `${stem}.${ext}`;
}

/**
 * Turn a public Storage URL into one that downloads rather than streams.
 *
 * Supabase Storage sends `Content-Disposition: attachment` when the request
 * carries `?download=<name>`. Without it the browser plays the file in a tab
 * instead of saving it, and the `download` attribute on an anchor is ignored
 * cross-origin, so this is the only thing that actually works here.
 *
 * Returns undefined for anything `streamableAudio` rejects, so a caller
 * cannot accidentally publish a signed or insecure URL as a download.
 */
export function downloadableAudio(
  url: string | null | undefined,
  title: string,
): string | undefined {
  const value = streamableAudio(url);
  if (!value) return undefined;
  const joiner = value.includes("?") ? "&" : "?";
  return `${value}${joiner}download=${encodeURIComponent(downloadName(title, value))}`;
}
