/**
 * Section type definitions for Chey's Time.
 *
 * The clock is driven entirely by the typed `Section[]` config in
 * `lib/sections.ts`. To add or change navigation you only edit that array —
 * geometry, the arm, the numerals and the panel all read from it.
 */

export type SectionKind =
  | "home"
  | "about"
  | "music"
  | "store"
  | "events"
  | "contact"
  | "press"
  | "blog"
  | "digital"
  | "gallery";

/**
 * Stable section ids. The six pillar sections sit on the even hours; the odd
 * hours carry Journal, Digital, Press and three gallery chapters, so every
 * numeral on the dial opens something.
 */
export type SectionId =
  | "home"
  | "about"
  | "music"
  | "store"
  | "events"
  | "contact"
  | "press"
  | "blog"
  | "digital"
  | `gallery-${string}`;

/** A single editorial photograph (used by galleries and panel banners). */
export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  meta?: string;
  /** CSS object-position so one photograph can serve several crops. */
  position?: string;
}

/** The photograph shown at the top of a section's panel. */
export interface SectionImage {
  src: string;
  alt: string;
  /** CSS object-position so one photograph can serve several crops. */
  position?: string;
  meta?: string;
}

/** A credit line (role → name) used on the About section. */
export interface Credit {
  role: string;
  name: string;
}

/** A music video / release with a YouTube id used for embedding. */
export interface MusicVideo {
  id: string;
  title: string;
  youtubeId: string;
  year?: string;
  note?: string;
}

/** A merch / store product. */
export interface Product {
  id: string;
  title: string;
  price: number;
  material: string;
}

/** A live event. `placeholder` marks migrated-but-unconfirmed data. */
export interface EventItem {
  id: string;
  title: string;
  dateLabel: string;
  location: string;
  description?: string;
  ticketUrl?: string;
}

/** An archive/gallery entry (caption + meta, optional photograph). */
export interface ArchiveItem {
  alt: string;
  meta: string;
  src?: string;
  /** CSS object-position so one photograph can serve several crops. */
  position?: string;
}

/** One label/value pair from the home data strip. */
export interface Fact {
  label: string;
  value: string;
}

/** A press feature — one piece of editorial coverage. */
export interface PressItem {
  id: string;
  /** Publication name, e.g. "BET". */
  outlet: string;
  headline: string;
  url: string;
  /** Pre-formatted on the server so the client never re-formats a date. */
  dateLabel?: string;
}

/** A written dispatch. `url` is set only when the post links out. */
export interface BlogPost {
  id: string;
  title: string;
  /** Pre-formatted on the server so the client never re-formats a date. */
  dateLabel: string;
  excerpt: string;
  /** External article, when the post points somewhere. */
  url?: string;
  thumbnail?: string;
}

/** A paid digital release (music_products). */
export interface DigitalRelease {
  id: string;
  title: string;
  artist: string;
  price: number;
  description?: string;
  cover?: string;
  /** Short preview clip — the only audio playable without buying. */
  previewUrl?: string;
}

/** A social or platform link. `url: null` => known channel, URL still missing. */
export interface SocialLink {
  label: string;
  url: string | null;
}

/**
 * Discriminated union of per-section content. The panel renderer switches on
 * `kind` to choose the correct layout.
 */
export type SectionData =
  | {
      kind: "home";
      tagline: string;
      location: string;
      intro: string;
      cue: string;
      /** The legacy home data strip: Based · Genre · Latest · Direction. */
      facts: Fact[];
    }
  | {
      kind: "about";
      bio: string[];
      quote: string;
      credits: Credit[];
    }
  | {
      kind: "music";
      channelLabel: string;
      channelUrl: string;
      videos: MusicVideo[];
      note?: string;
    }
  | {
      kind: "store";
      products: Product[];
      note?: string;
    }
  | {
      kind: "events";
      events: EventItem[];
      emptyMessage: string;
    }
  | {
      kind: "contact";
      email: string;
      blurb: string;
      sla: string;
      socials: SocialLink[];
      archive: ArchiveItem[];
    }
  | {
      kind: "press";
      description?: string;
      features: PressItem[];
      /** Affiliations shown as plain text (no article to link to). */
      affiliations: string[];
      emptyMessage: string;
    }
  | {
      kind: "blog";
      description?: string;
      posts: BlogPost[];
      emptyMessage: string;
    }
  | {
      kind: "digital";
      description?: string;
      releases: DigitalRelease[];
      note?: string;
      emptyMessage: string;
    }
  | {
      kind: "gallery";
      description?: string;
      images: GalleryImage[];
    };

export interface Section {
  /** Stable id used as React key and aria targets. */
  id: SectionId;
  /** Roman numeral shown on the clock face (e.g. "XII"). */
  numeral: string;
  /** Position on the 12-hour dial (0 = XII at top, clockwise). */
  hourIndex: number;
  /**
   * Arm rotation in degrees for this section. Single source of truth —
   * derived once from `hourIndex` in `lib/sections.ts`, never re-declared
   * elsewhere.
   */
  angle: number;
  /** Short editorial title (e.g. "About"). */
  title: string;
  /** Editorial subtitle (e.g. "The Manifesto"). */
  subtitle: string;
  /** `true` when the data is a clearly-labeled placeholder. */
  placeholder?: boolean;
  /** Photograph shown as the panel's opening image (varies per section). */
  image?: SectionImage;
  /** Typed, renderable content. */
  data: SectionData;
}
