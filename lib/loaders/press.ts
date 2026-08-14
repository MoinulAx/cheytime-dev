import type { SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";

type PressData = Extract<SectionData, { kind: "press" }>;

/**
 * Coverage dates are a month and year at most, no clock involved, so format
 * in UTC. Parsing a bare `date` column in local time can roll it back a day.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDateLabel(date: string | null): string | undefined {
  if (!date) return undefined;
  // A bare `YYYY-MM-DD` parses as UTC midnight; anything else is left to Date.
  const at = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date);
  return Number.isNaN(at.getTime()) ? undefined : DATE_FORMAT.format(at);
}

/**
 * Press (XI), live from `press_features`, published rows only.
 *
 * The affiliation list (SiriusXM, Live Nation) is editorial: those are logos on
 * the press kit with no article behind them, so they stay in the static config
 * rather than becoming empty-URL rows.
 */
export async function loadPress(fallback: PressData): Promise<PressData> {
  const features = await withSupabase("loadPress", async (db) => {
    const { data, error } = await db
      .from("press_features")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    return (data ?? []).flatMap((row) => {
      const url = text(row.url);
      // A feature with no link is just a logo, the affiliation list covers those.
      if (!url) return [];
      return [
        {
          id: row.id,
          outlet: text(row.outlet) ?? "Press",
          headline: text(row.headline) ?? "Feature",
          url,
          dateLabel: formatDateLabel(row.published_at),
        },
      ];
    });
  });

  if (!features || features.length === 0) return fallback;

  return {
    kind: "press",
    description: fallback.description,
    features,
    affiliations: fallback.affiliations,
    emptyMessage: fallback.emptyMessage,
  };
}
