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
 * Imagery comes straight from Chey's own videos: YouTube serves four distinct
 * frames per upload (hq1/hq2/hq3 + hqdefault), so every gallery and banner is
 * a real still of her — no stock, no generated photos. Replace with a proper
 * photo shoot when one is delivered (see MIGRATION_REPORT.md).
 */
const VIDEO_IDS = {
  poppin: "29vWUXMTkME",
  longKiss: "OamCSPuswjg",
  sessionIII: "4T6mFd2Sz_Y",
  sessionIV: "l62mMBXck70",
} as const;

/** URL of a YouTube frame: n = 1..3 for distinct stills, omit for default. */
const still = (videoId: string, n?: 1 | 2 | 3): string =>
  `https://i.ytimg.com/vi/${videoId}/${n ? `hq${n}` : "hqdefault"}.jpg`;

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
    id: "gallery-poppin",
    numeral: "I",
    hourIndex: 1,
    angle: angleForHour(1),
    title: "Poppin'",
    subtitle: "Gallery · One",
    data: {
      kind: "gallery",
      description: "Stills from the Poppin' video — her latest, frame by frame.",
      images: [
        frame(still(VIDEO_IDS.poppin, 1), "Chey — Poppin' video still", "Poppin' — Frame I", "Music Video · 2026"),
        frame(still(VIDEO_IDS.poppin, 2), "Chey — Poppin' video still", "Poppin' — Frame II", "Music Video · 2026"),
        frame(still(VIDEO_IDS.poppin, 3), "Chey — Poppin' video still", "Poppin' — Frame III", "Music Video · 2026"),
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
      src: still(VIDEO_IDS.poppin),
      alt: "Chey — still from the Poppin' music video",
      meta: "Still · Poppin' · 2026",
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
    id: "gallery-longkiss",
    numeral: "III",
    hourIndex: 3,
    angle: angleForHour(3),
    title: "Long Kiss Goodnight",
    subtitle: "Gallery · Two",
    data: {
      kind: "gallery",
      description: "On location for Long Kiss Goodnight.",
      images: [
        frame(still(VIDEO_IDS.longKiss, 1), "Chey — Long Kiss Goodnight video still", "Long Kiss Goodnight — Frame I", "Music Video · 2025"),
        frame(still(VIDEO_IDS.longKiss, 2), "Chey — Long Kiss Goodnight video still", "Long Kiss Goodnight — Frame II", "Music Video · 2025"),
        frame(still(VIDEO_IDS.longKiss, 3), "Chey — Long Kiss Goodnight video still", "Long Kiss Goodnight — Frame III", "Music Video · 2025"),
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
      src: still(VIDEO_IDS.longKiss),
      alt: "Chey — still from Long Kiss Goodnight",
      meta: "Still · Long Kiss Goodnight · 2025",
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
    id: "gallery-session3",
    numeral: "V",
    hourIndex: 5,
    angle: angleForHour(5),
    title: "Session III",
    subtitle: "Gallery · Three",
    data: {
      kind: "gallery",
      description: "Inside the Session III recording.",
      images: [
        frame(still(VIDEO_IDS.sessionIII, 1), "Chey — Session III still", "Session III — Frame I", "Session · YouTube"),
        frame(still(VIDEO_IDS.sessionIII, 2), "Chey — Session III still", "Session III — Frame II", "Session · YouTube"),
        frame(still(VIDEO_IDS.sessionIII, 3), "Chey — Session III still", "Session III — Frame III", "Session · YouTube"),
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
    id: "gallery-session4",
    numeral: "VII",
    hourIndex: 7,
    angle: angleForHour(7),
    title: "Session IV",
    subtitle: "Gallery · Four",
    data: {
      kind: "gallery",
      description: "Inside the Session IV recording.",
      images: [
        frame(still(VIDEO_IDS.sessionIV, 1), "Chey — Session IV still", "Session IV — Frame I", "Session · YouTube"),
        frame(still(VIDEO_IDS.sessionIV, 2), "Chey — Session IV still", "Session IV — Frame II", "Session · YouTube"),
        frame(still(VIDEO_IDS.sessionIV, 3), "Chey — Session IV still", "Session IV — Frame III", "Session · YouTube"),
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
      src: still(VIDEO_IDS.sessionIV),
      alt: "Chey — performance still",
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
    id: "gallery-reel",
    numeral: "IX",
    hourIndex: 9,
    angle: angleForHour(9),
    title: "The Reel",
    subtitle: "Gallery · Five",
    data: {
      kind: "gallery",
      description: "One frame from every release — the run so far.",
      images: [
        frame(still(VIDEO_IDS.poppin, 2), "Chey — Poppin' video still", "Poppin'", "2026"),
        frame(still(VIDEO_IDS.longKiss, 1), "Chey — Long Kiss Goodnight video still", "Long Kiss Goodnight", "2025"),
        frame(still(VIDEO_IDS.sessionIII, 2), "Chey — Session III still", "Session III", "YouTube"),
        frame(still(VIDEO_IDS.sessionIV, 3), "Chey — Session IV still", "Session IV", "YouTube"),
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
      src: still(VIDEO_IDS.longKiss, 3),
      alt: "Chey — still from Long Kiss Goodnight",
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
        { alt: "Music Video Shoot — Poppin'", meta: "Studio · 2026", src: still(VIDEO_IDS.poppin, 3) },
        { alt: "Long Kiss Goodnight", meta: "On Location · 2025", src: still(VIDEO_IDS.longKiss, 2) },
        { alt: "Studio Session — Vocal Take", meta: "Session III", src: still(VIDEO_IDS.sessionIII, 1) },
        { alt: "Behind the Scenes", meta: "Session IV", src: still(VIDEO_IDS.sessionIV, 1) },
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
      description: "Everything kept — the full contact sheet, one hour before midnight.",
      images: [
        frame(still(VIDEO_IDS.poppin), "Chey — Poppin' video still", "Vault No. 1 — Poppin'", "2026"),
        frame(still(VIDEO_IDS.longKiss), "Chey — Long Kiss Goodnight video still", "Vault No. 2 — Long Kiss Goodnight", "2025"),
        frame(still(VIDEO_IDS.sessionIII), "Chey — Session III still", "Vault No. 3 — Session III", "YouTube"),
        frame(still(VIDEO_IDS.sessionIV), "Chey — Session IV still", "Vault No. 4 — Session IV", "YouTube"),
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
