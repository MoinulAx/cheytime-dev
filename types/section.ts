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
  | "contact";

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

/** An archive/gallery entry (caption + meta). */
export interface ArchiveItem {
  alt: string;
  meta: string;
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
    };

export interface Section {
  /** Stable id used as React key and aria targets. */
  id: SectionKind;
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
  /** Typed, renderable content. */
  data: SectionData;
}
