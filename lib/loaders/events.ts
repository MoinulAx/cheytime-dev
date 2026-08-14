import type { SectionData } from "@/types/section";
import { text, withSupabase } from "./utils";

type EventsData = Extract<SectionData, { kind: "events" }>;

/**
 * Shows are booked in Chey's own timezone, so pin formatting to it. Without an
 * explicit zone the label would drift with the build machine's clock and read
 * differently between a local build and the deploy.
 */
const TIME_ZONE = "America/New_York";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

/**
 * "Sat, Mar 14, 2026, 8:00 PM". The label is built on the server and shipped
 * as a plain string, so the client never re-formats it and there is no
 * hydration mismatch. The em dash keeps it legible once the renderer joins it
 * to the venue with a middot.
 */
function formatDateLabel(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "Date to be announced";
  return `${DATE_FORMAT.format(at)} at ${TIME_FORMAT.format(at)}`;
}

/**
 * Events (VIII), live from `events`, published and upcoming only.
 *
 * RLS already restricts anon reads to `published = true`; the explicit filter
 * mirrors the legacy `usePublishedEvents` hook and keeps the intent readable.
 * No rows means no shows booked, the section keeps its static empty state.
 */
export async function loadEvents(fallback: EventsData): Promise<EventsData> {
  const events = await withSupabase("loadEvents", async (db) => {
    const { data, error } = await db
      .from("events")
      .select("*")
      .eq("published", true)
      .gte("date_time", new Date().toISOString())
      // Admin order first; the calendar date breaks ties, so a table
      // nobody has reordered still reads soonest-first.
      .order("sort_order", { ascending: true })
      .order("date_time", { ascending: true });
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      dateLabel: formatDateLabel(row.date_time),
      location: text(row.location) ?? "Venue to be announced",
      description: text(row.description),
      ticketUrl: text(row.ticket_link),
    }));
  });

  if (!events || events.length === 0) return fallback;

  return {
    kind: "events",
    events,
    emptyMessage: fallback.emptyMessage,
  };
}
