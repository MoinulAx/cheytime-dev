import type { Section, SectionId } from "@/types/section";
import { STATIC_SECTIONS } from "./sections.static";
import {
  applyContact,
  applyHome,
  applyMusicChannel,
  loadAbout,
  loadArchive,
  loadBlog,
  loadDigital,
  loadEvents,
  loadGallery,
  loadMusic,
  loadPress,
  loadSettings,
  loadStore,
} from "./loaders";

/**
 * Maps a gallery section id to its `gallery_items.collection` value. The
 * archive grid inside Contact uses `archive` and is loaded separately.
 */
const GALLERY_COLLECTIONS = {
  "gallery-videos": "videos",
  "gallery-sessions": "sessions",
  "gallery-reel": "reel",
} satisfies Partial<Record<SectionId, string>>;

type GallerySectionId = keyof typeof GALLERY_COLLECTIONS;

/**
 * Server-side section builder.
 *
 * ⚠️ This module reaches the server-only Supabase client. Client components
 * must import geometry and lookups from `lib/sections.static.ts` instead.
 *
 * The clock's shape — twelve hours, their numerals and angles — is fixed and
 * comes from the static config. Everything inside a panel is now live: copy
 * from `site_settings`, lists from their own tables. Every loader falls back
 * to its static content, so a Supabase outage costs freshness and nothing
 * else, and the site still renders exactly as it does today.
 */
export async function getSections(): Promise<Section[]> {
  const settings = await loadSettings();
  const bySection = new Map(STATIC_SECTIONS.map((s) => [s.id, s]));

  const dataOf = <K extends Section["data"]["kind"]>(
    id: SectionId,
    kind: K,
  ): Extract<Section["data"], { kind: K }> | null => {
    const data = bySection.get(id)?.data;
    return data?.kind === kind
      ? (data as Extract<Section["data"], { kind: K }>)
      : null;
  };

  const music = dataOf("music", "music");
  const store = dataOf("store", "store");
  const events = dataOf("events", "events");
  const contact = dataOf("contact", "contact");
  const press = dataOf("press", "press");
  const blog = dataOf("blog", "blog");
  const digital = dataOf("digital", "digital");
  const about = dataOf("about", "about");
  const home = dataOf("home", "home");

  const galleryIds = Object.keys(GALLERY_COLLECTIONS) as GallerySectionId[];

  const [
    musicData,
    storeData,
    eventsData,
    archiveData,
    pressData,
    blogData,
    digitalData,
    aboutData,
    ...galleryData
  ] = await Promise.all([
    music ? loadMusic(music) : null,
    store ? loadStore(store) : null,
    events ? loadEvents(events) : null,
    contact ? loadArchive(contact) : null,
    press ? loadPress(press) : null,
    blog ? loadBlog(blog) : null,
    digital ? loadDigital(digital) : null,
    about ? loadAbout(about, settings) : null,
    ...galleryIds.map((id) => {
      const fallback = dataOf(id, "gallery");
      return fallback
        ? loadGallery(GALLERY_COLLECTIONS[id], fallback)
        : Promise.resolve(null);
    }),
  ]);

  // `loadArchive` returns the whole contact payload; layer the editorial
  // strings and channel list over it before it goes out.
  const contactData = archiveData ? await applyContact(archiveData, settings) : null;

  const resolved: Partial<Record<string, Section["data"]>> = {
    home: home ? applyHome(home, settings) : undefined,
    about: aboutData ?? undefined,
    music: musicData ? applyMusicChannel(musicData, settings) : undefined,
    store: storeData ?? undefined,
    events: eventsData ?? undefined,
    contact: contactData ?? undefined,
    press: pressData ?? undefined,
    blog: blogData ?? undefined,
    digital: digitalData ?? undefined,
  };

  galleryIds.forEach((id, i) => {
    const data = galleryData[i];
    if (data) resolved[id] = data;
  });

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
