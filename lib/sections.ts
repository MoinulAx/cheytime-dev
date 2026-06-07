import type { Section } from "@/types/section";

/**
 * Roman numerals for all twelve dial positions, indexed by hour (0 = XII).
 * The clock renders all twelve; only the six in SECTIONS are interactive.
 */
export const ROMAN_NUMERALS = [
  "XII",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
] as const;

/** Degrees per hour on a 12-hour dial. */
export const DEGREES_PER_HOUR = 360 / 12; // 30

/**
 * Arm rotation for a given hour index. Single source of truth for angle —
 * sections derive their `angle` from this and nothing else re-declares it.
 * XII (index 0) => 0° (arm points straight up).
 */
export const angleForHour = (hourIndex: number): number =>
  hourIndex * DEGREES_PER_HOUR;

/**
 * ── CONTENT ──────────────────────────────────────────────────────────────
 * All copy is migrated from the legacy chey-music repo + the live cheytime.com
 * brand. This is the single content source until Supabase is wired in; the
 * shapes mirror the future DB tables so the swap is mechanical.
 */
export const SECTIONS: Section[] = [
  {
    id: "home",
    numeral: "XII",
    hourIndex: 0,
    angle: angleForHour(0),
    title: "Chey's Time",
    subtitle: "Hip Hop's Princess",
    data: {
      kind: "home",
      tagline: "Hip Hop's Princess",
      location: "Staten Island, New York",
      intro:
        "Relatable lyricism over upbeat, captivating production. Stream the sound, step into the archive, and catch what comes next — on Chey's time.",
      cue: "Choose an hour to begin",
    },
  },
  {
    id: "about",
    numeral: "II",
    hourIndex: 2,
    angle: angleForHour(2),
    title: "About",
    subtitle: "The Manifesto",
    data: {
      kind: "about",
      bio: [
        "Chey. Architect of sound — blending raw, relatable lyricism with heavy, captivating production.",
        "Born from a rejection of the polished and predictable. In a landscape saturated with overproduced noise, the choice was rawness. In a world addicted to trends, the choice was substance.",
        "Every release is a document of a specific tension — silence against static, restraint against aggression. The work lives at the intersection of sound and vision.",
      ],
      quote:
        "The mic captures the exact frequency of the room. The imperfections are intentional.",
      credits: [
        { role: "Artist", name: "Chey" },
        { role: "Production", name: "Chey" },
        { role: "Direction", name: "Chey" },
        { role: "Visuals", name: "Studio Null" },
      ],
    },
  },
  {
    id: "music",
    numeral: "IV",
    hourIndex: 4,
    angle: angleForHour(4),
    title: "Music",
    subtitle: "The Sound",
    data: {
      kind: "music",
      channelLabel: "@cheymusic127",
      channelUrl: "https://www.youtube.com/@cheymusic127",
      videos: [
        { id: "v1", title: "Poppin'", youtubeId: "29vWUXMTkME", year: "2026" },
        {
          id: "v2",
          title: "Long Kiss Goodnight",
          youtubeId: "OamCSPuswjg",
          year: "2025",
        },
        { id: "v3", title: "Session III", youtubeId: "4T6mFd2Sz_Y" },
        { id: "v4", title: "Session IV", youtubeId: "l62mMBXck70" },
      ],
      note: "Spotify & Apple Music links coming soon.",
    },
  },
  {
    id: "store",
    numeral: "VI",
    hourIndex: 6,
    angle: angleForHour(6),
    title: "Store",
    subtitle: "The Objects",
    data: {
      kind: "store",
      products: [
        { id: "p1", title: "Construct Tee — Black", price: 65, material: "Cotton 220gsm" },
        { id: "p2", title: "Volume VII Hoodie", price: 120, material: "French Terry 350gsm" },
        { id: "p3", title: "Scaffold Cap", price: 45, material: "Washed Canvas" },
        { id: "p4", title: "Absence Longsleeve", price: 75, material: "Cotton 200gsm" },
        { id: "p5", title: "Raw Print Tote", price: 35, material: "Heavy Canvas" },
        { id: "p6", title: "Material Tension Poster", price: 25, material: "70×100cm Matte" },
      ],
      note: "Secure checkout returns soon. Reserve a piece and we'll hold it.",
    },
  },
  {
    id: "events",
    numeral: "VIII",
    hourIndex: 8,
    angle: angleForHour(8),
    title: "Events",
    subtitle: "Upcoming",
    placeholder: true,
    data: {
      kind: "events",
      events: [],
      emptyMessage:
        "No dates on the calendar right now. New shows are announced here first — check back soon.",
    },
  },
  {
    id: "contact",
    numeral: "X",
    hourIndex: 10,
    angle: angleForHour(10),
    title: "Contact",
    subtitle: "Transmission & Archive",
    data: {
      kind: "contact",
      // TODO(client): confirm whether email should move to the cheytime.com domain.
      email: "contact@cheymusic.com",
      blurb: "For bookings, press, and collaboration.",
      sla: "Responses within 48 hours.",
      socials: [
        { label: "YouTube", url: "https://www.youtube.com/@cheymusic127" },
        { label: "Instagram", url: null },
        { label: "Spotify", url: null },
        { label: "Apple Music", url: null },
      ],
      archive: [
        { alt: "Music Video Shoot — Poppin'", meta: "Studio · 2026" },
        { alt: "Live Performance — Raw Set", meta: "Berlin · 2026" },
        { alt: "Long Kiss Goodnight", meta: "On Location · 2025" },
        { alt: "Studio Session — Vocal Take", meta: "Studio · 2026" },
        { alt: "Freestyle Set", meta: "London · 2025" },
        { alt: "Behind the Scenes", meta: "Tokyo · 2026" },
      ],
    },
  },
];

/** Hour indices that map to an interactive section. */
export const ACTIVE_HOURS = new Set(SECTIONS.map((s) => s.hourIndex));

/** Look up a section by its hour index (undefined for inactive numerals). */
export const sectionByHour = (hourIndex: number): Section | undefined =>
  SECTIONS.find((s) => s.hourIndex === hourIndex);

/** Look up a section by id. */
export const sectionById = (id: string): Section | undefined =>
  SECTIONS.find((s) => s.id === id);

/** The Home section (XII) — the clock's default / reset state. */
export const HOME_SECTION = SECTIONS[0];
