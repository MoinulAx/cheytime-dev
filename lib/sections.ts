import type { Section, SectionId } from "@/types/section";
import { STATIC_SECTIONS, placeSections } from "./sections.static";
import {
  applyContact,
  applyHome,
  applyMusicChannel,
  loadAbout,
  loadAlbum,
  loadBlog,
  loadDigital,
  loadEvents,
  loadGallery,
  loadMusic,
  loadPress,
  loadSectionChrome,
  loadSettings,
  loadStore,
  loadUpcoming,
} from "./loaders";

/**
 * Server-side section builder.
 *
 * ⚠️ This module reaches the server-only Supabase client. Client components
 * must import geometry and lookups from `lib/sections.static.ts` instead.
 *
 * Only the clock's geometry is fixed, twelve hours, their numerals and
 * angles. Everything a visitor reads is live: copy from `site_settings`,
 * lists from their own tables, and each section's title, subtitle, panel
 * image and supporting lines from `site_sections`. Every loader falls back to
 * the static baseline, so a Supabase outage costs freshness and nothing else.
 */
export async function getSections(): Promise<Section[]> {
  const [settings, chrome] = await Promise.all([
    loadSettings(),
    loadSectionChrome(),
  ]);

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

  const upcoming = dataOf("upcoming", "upcoming");
  const album = dataOf("album", "album");
  const music = dataOf("music", "music");
  const store = dataOf("store", "store");
  const events = dataOf("events", "events");
  const contact = dataOf("contact", "contact");
  const press = dataOf("press", "press");
  const blog = dataOf("blog", "blog");
  const digital = dataOf("digital", "digital");
  const about = dataOf("about", "about");
  const gallery = dataOf("gallery", "gallery");
  const home = dataOf("home", "home");

  const [
    upcomingData,
    albumData,
    musicData,
    storeData,
    eventsData,
    pressData,
    blogData,
    digitalData,
    aboutData,
    galleryData,
    contactData,
  ] = await Promise.all([
    upcoming ? loadUpcoming(upcoming) : null,
    album ? loadAlbum(album) : null,
    music ? loadMusic(music) : null,
    store ? loadStore(store) : null,
    events ? loadEvents(events) : null,
    press ? loadPress(press) : null,
    blog ? loadBlog(blog) : null,
    digital ? loadDigital(digital) : null,
    about ? loadAbout(about, settings) : null,
    gallery ? loadGallery(gallery) : null,
    contact ? applyContact(contact, settings) : null,
  ]);

  const resolved: Partial<Record<string, Section["data"]>> = {
    home: home ? applyHome(home, settings) : undefined,
    about: aboutData ?? undefined,
    album: albumData ?? undefined,
    upcoming: upcomingData ?? undefined,
    music: musicData ? applyMusicChannel(musicData, settings) : undefined,
    store: storeData ?? undefined,
    events: eventsData ?? undefined,
    gallery: galleryData ?? undefined,
    contact: contactData ?? undefined,
    press: pressData ?? undefined,
    blog: blogData ?? undefined,
    digital: digitalData ?? undefined,
  };

  const withContent = STATIC_SECTIONS.map((section) => {
    const data = resolved[section.id] ?? section.data;
    const skin = chrome[section.id];

    // The Events section is flagged as placeholder copy while the calendar is
    // empty, real bookings clear the flag.
    const placeholder =
      section.id === "events" && data.kind === "events" && data.events.length > 0
        ? undefined
        : section.placeholder;

    return {
      ...section,
      title: skin?.title ?? section.title,
      subtitle: skin?.subtitle ?? section.subtitle,
      image: skin?.image ?? section.image,
      data: skin ? applyChrome(data, skin) : data,
      placeholder,
    };
  });

  return placeSections(withContent, chrome);
}

/**
 * Overlay the editable supporting lines onto a section's payload.
 *
 * `description`, `note` and `emptyMessage` mean the same thing across several
 * kinds but only exist on some, so they are applied by presence rather than by
 * a switch over every variant.
 */
function applyChrome(
  data: Section["data"],
  skin: { description?: string; note?: string; emptyMessage?: string },
): Section["data"] {
  const next = { ...data } as Record<string, unknown>;
  if (skin.description && "description" in data) {
    next.description = skin.description;
  }
  if (skin.note && "note" in data) next.note = skin.note;
  if (skin.emptyMessage && "emptyMessage" in data) {
    next.emptyMessage = skin.emptyMessage;
  }
  return next as Section["data"];
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
