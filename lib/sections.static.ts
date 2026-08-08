import type { Section } from "@/types/section";

/**
 * Roman numerals for all twelve dial positions, indexed by hour (0 = XII).
 *
 * Ten hours open a section: Home XII, Journal I, About II, Music IV, Store VI,
 * Digital VII, Events VIII, Gallery IX, Contact X, Press XI. III and V carry
 * no section and render inactive — the photographs that used to fill them were
 * the same rows Gallery already shows, so padding the dial with them was
 * redundant rather than generous.
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
 * The fallback baseline. Nothing here is what a visitor normally sees.
 *
 * Every section is DB-backed: lists come from their own tables, copy from
 * `site_settings`, and each section's title, subtitle, panel image and
 * supporting lines from `site_sections`. This file is what renders when
 * Supabase is unreachable, so it is kept in step with the seeds rather than
 * left to rot.
 *
 * The About biography and the Home data strip are Chey's own words, verbatim
 * from the legacy /about and / pages. Earlier copy here ("Architect of
 * sound…", "Studio Null") was invented and appears nowhere on the legacy site
 * — read CONTENT_MAP.md before trusting MIGRATION_REPORT.md §3.
 */
export const STATIC_SECTIONS: Section[] = [
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
      // The legacy home data strip. This array decides which pairs exist —
      // `applyHome` walks it and looks up `home.fact.<label>` for each value,
      // so a label absent here is never read from the database at all.
      //
      // "Direction — Borleone Films" was dropped at the client's request. It
      // also contradicted `about_credits`, which credits direction to Chey;
      // both were rendering, in different panels. The `home.fact.direction`
      // row still exists in `site_settings` and still shows in the admin, but
      // nothing reads it — delete it there to stop it looking editable.
      facts: [
        { label: "Based", value: "Staten Island, NY" },
        { label: "Genre", value: "Hip-Hop" },
        { label: "Latest", value: "Whips & Chains Freestyle" },
      ],
    },
  },
  {
    id: "blog",
    numeral: "I",
    hourIndex: 1,
    angle: angleForHour(1),
    title: "Journal",
    subtitle: "Dispatches",
    data: {
      kind: "blog",
      description: "Notes, announcements and long-form from Chey and the team.",
      // Live from `blog_posts`. Nothing is seeded — the legacy site's posts
      // are the source, and this renders whatever is in the table.
      posts: [],
      emptyMessage:
        "No entries yet. Announcements and long-form land here first.",
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
      src: "/assets/chey-braids.jpg",
      alt: "Chey — portrait",
      meta: "Portrait · Staten Island",
    },
    data: {
      kind: "about",
      // Chey's own biography, verbatim from the legacy /about and / pages.
      // The copy that used to sit here ("Architect of sound…", "Studio Null")
      // appears nowhere on the legacy site — see CONTENT_MAP.md.
      bio: [
        "Cheyenne, professionally known as “Chey”, is a multifaceted rap artist and musician originally from Staten Island, NY. Her deep-rooted passion for music led her to pursue a career in the industry after initially working in the field of psychology, specifically with children with special needs. Transitioning from her previous profession, Chey fully committed herself to her music and acting aspirations, drawing inspiration from her family's strong musical background.",
        "Chey's introduction to rap music came from her father, who exposed her to the art of free-styling and rhymes. Having grown up in a musically inclined environment, she developed a love for both singing and performing from an early age. Her exposure to rap music, including iconic tracks like “Mama Said Knock You Out” by LL Cool J, played a pivotal role in shaping her artistic journey within the rap genre.",
        "Chey's musical style is a harmonious blend of relatable, upbeat, and lyrically captivating elements, aiming to resonate with a diverse audience. Her approach to her songs encompasses a wide range of themes, ensuring that her music reflects the experiences and emotions that people from different walks of life can relate to.",
        "She hopes to convey messages of originality and self-confidence through her artistry, encouraging her listeners to embrace their individuality. She is motivated by the positive reactions and support she receives from her fans, which serve as a driving force in her artistic endeavors.",
        "To aspiring artists seeking to establish themselves in the industry, Chey advocates for perseverance, self-authenticity, and steady dedication to their craft. She emphasizes the importance of staying true to one's vision and maintaining a positive outlook, even in the face of challenges.",
        "While staying true to her musical roots, she also envisions exploring opportunities in acting, allowing her to expand her creative horizons. Hip Hop's Princess artistic journey is characterized by a steadfast commitment to her profession, an unwavering desire to connect with her audience, and an aspiration to make a meaningful impact through her music.",
      ],
      quote: "I don't follow trends, I'm trending.",
      credits: [
        { role: "Artist", name: "Chey" },
        { role: "Production", name: "Chey" },
        { role: "Direction", name: "Chey" },
        { role: "Visuals", name: "rummspace" },
        { role: "Web", name: "rummspace" },
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
      src: "/assets/chey-furhat.jpg",
      alt: "Chey — portrait",
      meta: "Portrait · The Sound",
    },
    data: {
      kind: "music",
      channelLabel: "@CheyMusic127",
      channelUrl: "https://www.youtube.com/@CheyMusic127",
      // Titles transcribed from `music_releases` (whitespace trimmed) so this
      // fallback names the same track the id actually plays.
      //
      // The four entries that stood here were wrong in both directions: two
      // titles were invented ("Session III", "Session IV") and the two that
      // were real were attached to the wrong videos — 29vWUXMTkME was labelled
      // "Poppin'" when it is "Girls Just Wanna Have Fun", and OamCSPuswjg was
      // labelled "Long Kiss Goodnight" when it is the Poppin' freestyle. Same
      // origin as the invented bio recorded in MIGRATION_REPORT.md §3.
      //
      // No `year`: the table has no release-year column, so the live loader
      // derives one from `created_at` (the row's insert date). Guessing a year
      // here would assert something neither source supports.
      videos: [
        {
          id: "v1",
          title: "CHEY - Girls Just Wanna Have Fun FT. Steph G (GJWHF)",
          youtubeId: "29vWUXMTkME",
        },
        { id: "v2", title: "Poppin freestyle", youtubeId: "OamCSPuswjg" },
        { id: "v3", title: "Long kiss goodnight", youtubeId: "4T6mFd2Sz_Y" },
        {
          id: "v4",
          title: "CHEY - Bar talk ft Hue Hef & Jmaul",
          youtubeId: "l62mMBXck70",
        },
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
    id: "digital",
    numeral: "VII",
    hourIndex: 7,
    angle: angleForHour(7),
    title: "Digital",
    subtitle: "Downloads",
    image: {
      src: "/assets/chey-earring.jpg",
      alt: "Chey — portrait",
      meta: "Digital · Downloads",
    },
    data: {
      kind: "digital",
      description: "Buy the record outright — yours to keep, no stream needed.",
      // Live from `music_products`. Only previews are exposed here; the full
      // file is released by the secure-download function after purchase.
      releases: [],
      note: "Checkout runs from the legacy store while payments are being moved across.",
      emptyMessage:
        "Nothing on sale right now. New drops are announced here and on the Journal.",
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
    id: "gallery",
    numeral: "IX",
    hourIndex: 9,
    angle: angleForHour(9),
    title: "Gallery",
    subtitle: "The Archive",
    data: {
      kind: "gallery",
      description: "Every frame, in one place.",
      // Live from `gallery_items` — all of it. This is the only photo surface
      // on the clock; the chapters that used to sit on III, V and IX, and the
      // grid that used to sit inside Contact, were four views of one table.
      images: [],
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
      // Management address as published in the 2026 press kit.
      email: "Smgproductions2024@gmail.com",
      blurb: "For bookings, press, and collaboration.",
      sla: "Responses within 48 hours.",
      socials: [
        { label: "YouTube", url: "https://www.youtube.com/@CheyMusic127" },
        { label: "Instagram", url: "https://www.instagram.com/imchey__/" },
        { label: "TikTok", url: "https://www.tiktok.com/@cheymusic" },
        { label: "Spotify", url: null },
        { label: "Apple Music", url: null },
      ],
    },
  },
  {
    id: "press",
    numeral: "XI",
    hourIndex: 11,
    angle: angleForHour(11),
    title: "Press",
    subtitle: "The Record",
    image: {
      src: "/assets/chey-mediakit.jpg",
      alt: "Chey — 2024 media kit cover",
      meta: "Press · Media Kit",
    },
    data: {
      kind: "press",
      description: "Where the work has been written about.",
      // Live from `press_features`; this is the last-known-good copy, seeded
      // from the 2026 press kit.
      features: [
        {
          id: "pr-iheart",
          outlet: "iHeartRadio",
          headline: "Way Up With Angela Yee: Chey Smith Tells Us A Secret",
          url: "https://wjlbdetroit.iheart.com/featured/angela-yee/content/2024-05-31-1119-way-up-with-angela-yee-way-up-with-chey-smith-tell-us-a-secret/",
          dateLabel: "May 2024",
        },
        {
          id: "pr-bet",
          outlet: "BET",
          headline: "Method Man’s Daughter Releases Her New Music",
          url: "https://www.bet.com/article/t1pii7/method-mans-daughter-releases-her-new-music",
        },
        {
          id: "pr-vibe",
          outlet: "VIBE",
          headline: "Method Man’s Daughter Chey Performs With Trina In Detroit",
          url: "https://www.vibe.com/music/music-news/method-man-daughter-chey-perform-trina-detroit-1234862254/",
        },
        {
          id: "pr-interview",
          outlet: "YouTube",
          headline: "Interview",
          url: "https://www.youtube.com/watch?v=buAynLjO8ok",
        },
      ],
      // Logos on the press kit with no article behind them.
      affiliations: ["SiriusXM — Hip-Hop & R&B", "Live Nation"],
      emptyMessage:
        "Coverage is being gathered. Press enquiries are welcome — the line is open on X.",
    },
  },
];

/*
 * ── LOOKUPS ──────────────────────────────────────────────────────────────
 * These take the resolved section list rather than closing over the static
 * array: once Music/Store/Events/Contact are fetched per request, the client
 * must read from the list the server actually rendered. They live here (not in
 * `lib/sections.ts`) because client components import them, and that module
 * pulls in the server-only Supabase client.
 */

/** Hour indices that map to an interactive section. */
export const activeHours = (sections: Section[]): Set<number> =>
  new Set(sections.map((s) => s.hourIndex));

/** Look up a section by its hour index (undefined for inactive numerals). */
export const sectionByHour = (
  sections: Section[],
  hourIndex: number,
): Section | undefined => sections.find((s) => s.hourIndex === hourIndex);

/** Look up a section by id. */
export const sectionById = (
  sections: Section[],
  id: string,
): Section | undefined => sections.find((s) => s.id === id);

/** The Home section (XII) — the clock's default / reset state. */
export const homeSection = (sections: Section[]): Section =>
  sections.find((s) => s.id === "home") ?? sections[0];
