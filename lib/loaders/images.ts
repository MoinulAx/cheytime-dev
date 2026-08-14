/**
 * Image host allowlist, mirroring `next.config.ts` → `images.remotePatterns`.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────
 * `next/image` throws when given a src whose host is not configured, and that
 * throw happens during render, so one bad row in the CMS takes down the whole
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

/** Supabase Storage, only the public object path is served. */
const SUPABASE_HOST = /\.supabase\.co$/;
const SUPABASE_PUBLIC_PATH = "/storage/v1/object/public/";

/**
 * Does this relative path actually exist under `public/`?
 *
 * "Relative paths are served by this app" was assumed rather than checked, and
 * it stopped being true the moment a commit deleted three files that six
 * database rows still pointed at, a broken hero on Journal, Events and
 * Contact, plus three dead tiles in the archive, all from one deletion. The
 * URL shape was still valid, so nothing upstream could catch it.
 *
 * **Fails open.** If `public/` cannot be read at all, a runtime where the
 * directory is served by a CDN rather than sitting on the function's disk,
 * we must not conclude the files are missing, or every local image on the site
 * would disappear at once. That is far worse than the handful this catches. So
 * a missing *directory* means "cannot judge, allow"; only a readable directory
 * with an absent *file* is a real miss.
 *
 * Only loaders import this module, all of them server-side, so `node:fs` never
 * reaches the browser bundle.
 */
const publicFileCache = new Map<string, boolean>();

function publicFileExists(pathname: string): boolean {
  const cached = publicFileCache.get(pathname);
  if (cached !== undefined) return cached;

  let verdict = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("node:path") as typeof import("node:path");
    const root = path.join(process.cwd(), "public");
    if (fs.existsSync(root)) {
      verdict = fs.existsSync(path.join(root, pathname.replace(/^\//, "")));
    }
  } catch {
    // No filesystem here (edge runtime, bundling). Cannot judge, allow.
    verdict = true;
  }

  publicFileCache.set(pathname, verdict);
  return verdict;
}

/**
 * `true` when `next/image` can render this URL without throwing.
 *
 * Relative paths (`/assets/...`) are served by this app, but only if the file
 * is still there; see {@link publicFileExists}.
 */
export function isRenderableImage(url: string | undefined): url is string {
  if (!url) return false;
  const raw = url.trim();
  if (!raw) return false;
  if (raw.startsWith("/")) return publicFileExists(raw.split(/[?#]/)[0]);

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
