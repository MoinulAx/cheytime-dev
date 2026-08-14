import { createStaticClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isFrameworkSignal } from "@/lib/next-signals";

type ServerClient = ReturnType<typeof createStaticClient>;

/**
 * Run a Supabase read, degrading to `null` instead of throwing.
 *
 * Content is not worth an outage: if the project is unreachable, misconfigured
 * or a policy changes underneath us, the caller falls back to the static copy
 * in `lib/sections.static.ts` and the clock still renders. Failures are logged
 * server-side so they surface in the deploy logs rather than in the UI.
 */
export async function withSupabase<T>(
  label: string,
  run: (db: ServerClient) => Promise<T>,
): Promise<T | null> {
  if (!isSupabaseConfigured) {
    console.warn(
      `[loaders] ${label}: Supabase env missing, using static content. ` +
        `Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.`,
    );
    return null;
  }
  try {
    return await run(createStaticClient());
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;
    console.error(`[loaders] ${label} failed, using static content.`, error);
    return null;
  }
}

/** Trim to a non-empty string, or `undefined`. Never leaks a DB null. */
export const text = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Four-digit year from an ISO timestamp, or `undefined`. */
export const yearOf = (iso: string | null | undefined): string | undefined => {
  if (!iso) return undefined;
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? undefined : String(at.getUTCFullYear());
};

const YOUTUBE_ID = /^[\w-]{11}$/;

/**
 * Pull an embeddable YouTube id out of whatever the admin pasted.
 *
 * The legacy `music_releases` table stores a generic `platform_link`, so a row
 * may point at Spotify or Apple Music instead. Those cannot drive the
 * `LiteYouTube` player, so they resolve to `null` and the loader drops them,
 * adapting at the fetch layer rather than widening `MusicVideo`.
 */
export function youtubeIdFrom(link: string | null | undefined): string | null {
  const raw = link?.trim();
  if (!raw) return null;
  if (YOUTUBE_ID.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return YOUTUBE_ID.test(id) ? id : null;
  }

  if (host !== "youtube.com" && host !== "m.youtube.com") return null;

  const v = url.searchParams.get("v");
  if (v && YOUTUBE_ID.test(v)) return v;

  const path = url.pathname.match(/^\/(?:embed|shorts|v|live)\/([\w-]{11})/);
  return path ? path[1] : null;
}
