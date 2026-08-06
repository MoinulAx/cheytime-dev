import type { Section } from "@/types/section";
import { STATIC_SECTIONS } from "./sections.static";
import { loadArchive, loadEvents, loadMusic, loadStore } from "./loaders";

/**
 * Server-side section builder.
 *
 * ⚠️ This module reaches the server-only Supabase client. Client components
 * must import geometry and lookups from `lib/sections.static.ts` instead.
 *
 * The clock's shape — twelve hours, their numerals, angles, titles and
 * photographs — is fixed and comes from the static config. All this does is
 * swap the `data` payload of the four DB-backed sections for live rows. Every
 * loader falls back to its static content, so a Supabase outage costs freshness
 * and nothing else.
 */
export async function getSections(): Promise<Section[]> {
  const bySection = new Map(STATIC_SECTIONS.map((s) => [s.id, s]));

  const music = bySection.get("music");
  const store = bySection.get("store");
  const events = bySection.get("events");
  const contact = bySection.get("contact");

  const [musicData, storeData, eventsData, contactData] = await Promise.all([
    music?.data.kind === "music" ? loadMusic(music.data) : null,
    store?.data.kind === "store" ? loadStore(store.data) : null,
    events?.data.kind === "events" ? loadEvents(events.data) : null,
    contact?.data.kind === "contact" ? loadArchive(contact.data) : null,
  ]);

  const resolved: Partial<Record<string, Section["data"]>> = {
    music: musicData ?? undefined,
    store: storeData ?? undefined,
    events: eventsData ?? undefined,
    contact: contactData ?? undefined,
  };

  return STATIC_SECTIONS.map((section) => {
    const data = resolved[section.id];
    if (!data) return section;

    // The Events section is flagged as placeholder copy while the calendar is
    // empty — real bookings clear the flag.
    const placeholder =
      section.id === "events" && data.kind === "events" && data.events.length > 0
        ? undefined
        : section.placeholder;

    return { ...section, data, placeholder };
  });
}

export {
  ROMAN_NUMERALS,
  DEGREES_PER_HOUR,
  angleForHour,
  STATIC_SECTIONS,
  activeHours,
  sectionByHour,
  sectionById,
  homeSection,
} from "./sections.static";
