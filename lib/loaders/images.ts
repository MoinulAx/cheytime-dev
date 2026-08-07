/**
 * Image host allowlist, mirroring `next.config.ts` → `images.remotePatterns`.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────
 * `next/image` throws when given a src whose host is not configured, and that
 * throw happens during render — so one bad row in the CMS takes down the whole
 * page, not just its own panel. Content editors can paste any URL, so this is
 * a matter of when, not if.
 *
 * Checking here means an unusable URL is dropped at the fetch layer like every
 * other bad value, and the section renders without it.
 *
 * Keep in step with `next.config.ts`: a host allowed there but missing here is
 * merely ignored, but a host allowed here and missing there crashes the page.
 */
const ALLOWED_EXACT = new Set(["i.ytimg.com", "img.youtube.com"]);

/** Supabase Storage — only the public object path is served. */
const SUPABASE_HOST = /\.supabase\.co$/;
const SUPABASE_PUBLIC_PATH = "/storage/v1/object/public/";

/**
 * `true` when `next/image` can render this URL without throwing.
 *
 * Relative paths (`/assets/...`) are always fine — they are served by this app.
 */
export function isRenderableImage(url: string | undefined): url is string {
  if (!url) return false;
  const raw = url.trim();
  if (!raw) return false;
  if (raw.startsWith("/")) return true;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;

  const host = parsed.hostname;
  if (ALLOWED_EXACT.has(host)) return true;
  if (SUPABASE_HOST.test(host)) {
    // Signed URLs (/object/sign/) expire and are not in the configured
    // pattern, so they would throw.
    return parsed.pathname.startsWith(SUPABASE_PUBLIC_PATH);
  }
  return false;
}

/** The URL if it can be rendered, otherwise `undefined`. */
export const renderableImage = (
  url: string | undefined,
): string | undefined => (isRenderableImage(url) ? url : undefined);
