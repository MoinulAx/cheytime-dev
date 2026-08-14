import type { SectionImage } from "@/types/section";
import { text, withSupabase } from "./utils";
import { renderableImage } from "./images";

/** The editable shell of one section, as stored in `site_sections`. */
export interface SectionChrome {
  title?: string;
  subtitle?: string;
  image?: SectionImage;
  description?: string;
  note?: string;
  emptyMessage?: string;
  /**
   * Which hour of the dial this section sits on, 0-11 (0 = XII, clockwise).
   * Undefined keeps the built-in position. See `placeSections`.
   */
  hourIndex?: number;
}

/** 0-11 or nothing. Anything else in the column is ignored rather than trusted. */
function hourIndexOf(value: number | null): number | undefined {
  if (value === null || !Number.isInteger(value)) return undefined;
  if (value < 0 || value > 11) return undefined;
  return value;
}

/**
 * Every section's title, subtitle, panel image and supporting lines, keyed by
 * section id.
 *
 * These were the last strings compiled into the bundle. They are shell rather
 * than body, the words around the content, but they were still a deploy away
 * from being changed, which is the thing this migration set out to remove.
 *
 * A field is only returned when it is non-empty, so a blank cell in the admin
 * means "leave the built-in wording alone" rather than "render nothing".
 */
export async function loadSectionChrome(): Promise<
  Record<string, SectionChrome>
> {
  const chrome = await withSupabase("loadSectionChrome", async (db) => {
    const { data, error } = await db.from("site_sections").select("*");
    if (error) throw error;

    const out: Record<string, SectionChrome> = {};
    for (const row of data ?? []) {
      const src = renderableImage(text(row.image_url));
      out[row.section_id] = {
        title: text(row.title),
        subtitle: text(row.subtitle),
        image: src
          ? {
              src,
              alt: text(row.image_alt) ?? "Chey",
              meta: text(row.image_meta),
              // Blank falls through to the renderer's centred default.
              position: text(row.image_position),
            }
          : undefined,
        description: text(row.description),
        note: text(row.note),
        emptyMessage: text(row.empty_message),
        hourIndex: hourIndexOf(row.hour_index),
      };
    }
    return out;
  });

  return chrome ?? {};
}
