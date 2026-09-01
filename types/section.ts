/**
 * Section type definitions for Chey's Time.
 *
 * The clock is driven entirely by the typed `Section[]` config in
 * `lib/sections.ts`. To add or change navigation you only edit that array,
 * geometry, the arm, the numerals and the panel all read from it.
 */

export type SectionKind =
  | "home"
  | "about"
  | "album"
  | "upcoming"
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
  | "album"
  | "upcoming"
  | "music"
  | "store"
  | "events"
  | "contact"
  | "press"
  | "blog"
  | "digital"
  | "gallery";

/** A single editorial photograph (used by galleries and panel banners). */
export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  meta?: string;
  /** CSS object-position so one photograph can serve several crops. */
  position?: string;
  /**
   * The frame this photograph is drawn into, from `gallery_items.aspect_ratio`.
   *
   * Every image used to be forced into 16:9 regardless of its real shape,
   * which cropped portraits to a letterbox and upscaled small sources three
   * times over, the single biggest cause of the archive looking soft.
   */
  aspect?: "square" | "portrait" | "landscape";
}

/**
 * An archive entry that lives off-site rather than being a photograph.
 *
 * `gallery_items.image_url` holds Instagram permalinks as well as images,
 * appearances and performances that were only ever posted there. They are not
 * images, so `next/image` cannot draw them and the loader used to drop them,
 * silently losing the row. Kept as links instead.
 */
export interface GalleryLink {
  url: string;
  /** The row's caption, used as the link text. */
  title: string;
  meta?: string;
  /** Recognised source, e.g. "Instagram", falls back to the hostname. */
  platform: string;
  /** What the link opens, when known: "Reel", "Post". */
  kind?: string;
  /**
   * Embeddable player URL, when the source offers one. Present for Instagram
   * posts and reels, matching the legacy gallery. Absent means the entry can
   * only be linked to, so the card is the whole treatment.
   */
  embedUrl?: string;
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
  /**
   * Product photograph. Optional because a row may genuinely have none, and
   * because the loader drops any URL `next/image` cannot render. Absent means
   * the tile falls back to its numbered placeholder.
   */
  image?: string;
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

/** A press feature, one piece of editorial coverage. */
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

/**
 * One entry in the Journal index at `/journal`.
 *
 * Deliberately separate from {@link BlogPost}, which is what the clock panel
 * carries. The panel is a preview and ships inside the home page's payload, so
 * it must stay small; these pages fetch their own rows and can afford more.
 */
export interface JournalEntry {
  id: string;
  slug: string;
  title: string;
  dateLabel: string;
  excerpt: string;
  thumbnail?: string;
  /** External article, when the post points somewhere as well. */
  url?: string;
}

/** A full Journal post at `/journal/[slug]`. */
export interface JournalPost extends JournalEntry {
  /** `blog_posts.body`, split into paragraphs on blank lines. */
  body: string[];
}

/**
 * One track on a record, with a full streamable file.
 *
 * Unlike {@link DigitalRelease}, `audioUrl` here is the whole song, not an
 * excerpt. That is deliberate: the Album hour streams the record in full.
 * The file lives in the public `music-files` bucket, so anyone who reads the
 * page source can download it, which is the intent for this hour, but means
 * nothing paid should ever be pointed at it.
 */
export interface AlbumTrack {
  id: string;
  title: string;
  /** Absent when the row exists but no audio has been uploaded yet. */
  audioUrl?: string;
  description?: string;
  /** Sleeve/thumbnail for the individual track, when it carries its own. */
  artwork?: string;
}

/** A record: sleeve, editorial, and an ordered tracklist. */
export interface AlbumRecord {
  id: string;
  title: string;
  description?: string;
  cover?: string;
  /** Pre-formatted on the server so the client never re-formats a date. */
  year?: string;
  tracks: AlbumTrack[];
  /**
   * Where to hear it when the files are not hosted here.
   *
   * A record released to Apple Music or Spotify has nothing to upload: the
   * streaming service holds it. Without this the hour could only show music
   * we hold the audio for, so such a release could not appear at all.
   */
  link?: { url: string; label: string };
}

/**
 * An announced release, something that is coming, or has just landed.
 *
 * Distinct from {@link MusicVideo} and {@link AlbumRecord}, which are both
 * catalogue and need the thing to exist before they can show it. This is the
 * announcement: a title, a date that may not be fixed yet, a poster, and often
 * nothing playable at all.
 */
export interface UpcomingRelease {
  id: string;
  title: string;
  /** Pre-formatted on the server. Absent when no date is confirmed. */
  dateLabel?: string;
  /** "Coming soon" · "Pre-save" · "Out now", derived from status and date. */
  statusLabel: string;
  /** True once it is out, so the card can lead rather than tease. */
  released: boolean;
  description?: string;
  artwork?: string;
  /**
   * YouTube id, when the announcement has a video rather than just a still.
   * Takes priority over `artwork`, a teaser is the thing people click.
   */
  youtubeId?: string;
  url?: string;
  /** Button wording, e.g. "Listen". Falls back to a sensible default. */
  linkLabel?: string;
}

/** A digital release (music_products). */
export interface DigitalRelease {
  id: string;
  title: string;
  artist: string;
  price: number;
  description?: string;
  cover?: string;
  /** Short preview clip. Present on every row, free or not. */
  previewUrl?: string;
  /** Marked as a giveaway in the admin. Drives the badge and the button. */
  free?: boolean;
  /**
   * Full track, downloadable. Only ever set on a free row: the loader reads
   * `audio_url` for those alone, so a paid master never reaches the browser
   * even as a URL. Absent on a free row means the file is missing or is a
   * signed URL that would expire, and the row falls back to its preview.
   */
  downloadUrl?: string;
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
      /**
       * Production credit mark shown beside the build credit in the footer.
       *
       * Absent when no logo has been uploaded, the footer then renders the
       * text credit alone rather than a gap or a broken image.
       */
      brandLogo?: { src: string; alt: string; url?: string };
    }
  | {
      kind: "about";
      bio: string[];
      quote: string;
      credits: Credit[];
    }
  | {
      kind: "upcoming";
      description?: string;
      releases: UpcomingRelease[];
      emptyMessage: string;
    }
  | {
      kind: "album";
      description?: string;
      albums: AlbumRecord[];
      emptyMessage: string;
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
      /**
       * Kept as an optional escape hatch, but the panel no longer renders a
       * grid here, photographs live in the Gallery section, which is the one
       * place they come from. See CONTENT_MAP.md.
       */
      archive?: ArchiveItem[];
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
      /** Off-site entries, rendered as link cards below the photographs. */
      links?: GalleryLink[];
    };

export interface Section {
  /** Stable id used as React key and aria targets. */
  id: SectionId;
  /** Roman numeral shown on the clock face (e.g. "XII"). */
  numeral: string;
  /** Position on the 12-hour dial (0 = XII at top, clockwise). */
  hourIndex: number;
  /**
   * Arm rotation in degrees for this section. Single source of truth,
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
