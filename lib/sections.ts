import type { GalleryImage, Section } from "@/types/section";

/**
 * Roman numerals for all twelve dial positions, indexed by hour (0 = XII).
 * Every hour is interactive: the six named sections sit on the even hours,
 * six photographic gallery chapters sit on the odd hours.
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
 * The photo library. Three photographs exist today; galleries and panel
 * banners re-crop them via object-position until the full shoot is delivered
 * (see MIGRATION_REPORT.md — "clean artist photo set" is still missing).
 */
export const PHOTOS = {
  figure: "/assets/chey-figure.jpg",
  motion: "/assets/chey-motion.jpg",
  hands: "/assets/chey-hands.jpg",
} as const;

/** Build a gallery frame with the shared caption format. */
const frame = (
  src: string,
  alt: string,
  caption: string,
  meta: string,
  position?: string,
): GalleryImage => ({ src, alt, caption, meta, position });

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
    id: "gallery-portrait",
    numeral: "I",
    hourIndex: 1,
    angle: angleForHour(1),
    title: "The Portrait",
    subtitle: "Gallery · One",
    data: {
      kind: "gallery",
      description: "Full-length studies. Coat, shadow, and stance.",
      images: [
        frame(
          PHOTOS.figure,
          "Chey — full-length portrait in a dark coat",
          "Figure Study No. 1",
          "Staten Island · 2026",
        ),
        frame(
          PHOTOS.figure,
          "Chey — portrait detail, upper frame",
          "Figure Study No. 2",
          "Staten Island · 2026",
          "50% 12%",
        ),
      ],
    },
  },
  {
    id: "about",
    numeral: "II",
    hourIndex: 2,
    angle: angleForHour(2),
    title: "About",
    subtitle: "The Manifesto",
    image: {
      src: PHOTOS.figure,
      alt: "Chey — full-length portrait in a dark coat",
      position: "50% 18%",
      meta: "Portrait · Staten Island",
    },
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
    id: "gallery-motion",
    numeral: "III",
    hourIndex: 3,
    angle: angleForHour(3),
    title: "In Motion",
    subtitle: "Gallery · Two",
    data: {
      kind: "gallery",
      description: "Movement frames. Fabric mid-air, nothing posed twice.",
      images: [
        frame(
          PHOTOS.motion,
          "Chey — motion portrait, dress in movement",
          "Motion Frame No. 1",
          "On Location · 2025",
        ),
        frame(
          PHOTOS.motion,
          "Chey — motion portrait, detail crop",
          "Motion Frame No. 2",
          "On Location · 2025",
          "50% 80%",
        ),
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
    image: {
      src: PHOTOS.motion,
      alt: "Chey — motion portrait, dress in movement",
      position: "50% 30%",
      meta: "Session Still · 2025",
    },
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
    id: "gallery-details",
    numeral: "V",
    hourIndex: 5,
    angle: angleForHour(5),
    title: "The Details",
    subtitle: "Gallery · Three",
    data: {
      kind: "gallery",
      description: "Close work. Hands, rings, the small signatures.",
      images: [
        frame(
          PHOTOS.hands,
          "Chey — hands with rings, close frame",
          "Detail No. 1 — Rings",
          "Studio · 2026",
        ),
        frame(
          PHOTOS.hands,
          "Chey — hands with rings, alternate crop",
          "Detail No. 2 — Gesture",
          "Studio · 2026",
          "20% 50%",
        ),
      ],
    },
  },
  {
    id: "store",
    numeral: "VI",
    hourIndex: 6,
    angle: angleForHour(6),
    title: "Store",
    subtitle: "The Objects",
    image: {
      src: PHOTOS.hands,
      alt: "Chey — hands with rings, close frame",
      position: "70% 50%",
      meta: "Object Study · 2026",
    },
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
    id: "gallery-onset",
    numeral: "VII",
    hourIndex: 7,
    angle: angleForHour(7),
    title: "On Set",
    subtitle: "Gallery · Four",
    data: {
      kind: "gallery",
      description: "Between takes — the video shoots, unguarded.",
      images: [
        frame(
          PHOTOS.figure,
          "Chey — on set, full figure",
          "Set Still No. 1 — Poppin'",
          "Music Video · 2026",
          "50% 60%",
        ),
        frame(
          PHOTOS.motion,
          "Chey — on set, in movement",
          "Set Still No. 2 — Long Kiss Goodnight",
          "Music Video · 2025",
          "50% 45%",
        ),
      ],
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
    image: {
      src: PHOTOS.motion,
      alt: "Chey — motion portrait, dress in movement",
      position: "50% 65%",
      meta: "Live · Coming Soon",
    },
    data: {
      kind: "events",
      events: [],
      emptyMessage:
        "No dates on the calendar right now. New shows are announced here first — check back soon.",
    },
  },
  {
    id: "gallery-afterhours",
    numeral: "IX",
    hourIndex: 9,
    angle: angleForHour(9),
    title: "After Hours",
    subtitle: "Gallery · Five",
    data: {
      kind: "gallery",
      description: "When the session ends and the city doesn't.",
      images: [
        frame(
          PHOTOS.motion,
          "Chey — late portrait in movement",
          "After Hours No. 1",
          "New York · 2025",
          "50% 20%",
        ),
        frame(
          PHOTOS.hands,
          "Chey — hands at rest, rings catching light",
          "After Hours No. 2",
          "New York · 2025",
          "45% 50%",
        ),
      ],
    },
  },
  {
    id: "contact",
    numeral: "X",
    hourIndex: 10,
    angle: angleForHour(10),
    title: "Contact",
    subtitle: "Transmission & Archive",
    image: {
      src: PHOTOS.hands,
      alt: "Chey — hands with rings, close frame",
      position: "30% 40%",
      meta: "Open Line · 48hr Reply",
    },
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
        { alt: "Music Video Shoot — Poppin'", meta: "Studio · 2026", src: PHOTOS.figure, position: "50% 20%" },
        { alt: "Live Performance — Raw Set", meta: "Berlin · 2026", src: PHOTOS.motion, position: "50% 35%" },
        { alt: "Long Kiss Goodnight", meta: "On Location · 2025", src: PHOTOS.motion, position: "50% 70%" },
        { alt: "Studio Session — Vocal Take", meta: "Studio · 2026", src: PHOTOS.hands, position: "30% 50%" },
        { alt: "Freestyle Set", meta: "London · 2025", src: PHOTOS.figure, position: "50% 55%" },
        { alt: "Behind the Scenes", meta: "Tokyo · 2026", src: PHOTOS.hands, position: "70% 50%" },
      ],
    },
  },
  {
    id: "gallery-vault",
    numeral: "XI",
    hourIndex: 11,
    angle: angleForHour(11),
    title: "The Vault",
    subtitle: "Gallery · Six",
    data: {
      kind: "gallery",
      description: "Everything kept. The full contact sheet, one hour before midnight.",
      images: [
        frame(
          PHOTOS.figure,
          "Chey — full-length portrait in a dark coat",
          "Vault No. 1 — Figure",
          "Staten Island · 2026",
        ),
        frame(
          PHOTOS.motion,
          "Chey — motion portrait, dress in movement",
          "Vault No. 2 — Motion",
          "On Location · 2025",
        ),
        frame(
          PHOTOS.hands,
          "Chey — hands with rings, close frame",
          "Vault No. 3 — Hands",
          "Studio · 2026",
        ),
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
