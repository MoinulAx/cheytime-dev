/**
 * Admin table definitions.
 *
 * The legacy admin was organised around the old site's *pages* (blog,
 * portfolio, shop). This one is organised around the clock's *hours*, because
 * that is what the new site actually renders — each tab names the numeral it
 * feeds, so it is obvious where an edit will show up.
 *
 * Adding a field here adds it to the form, the create defaults and the save
 * payload. There is no per-table component to update.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "url"
  | "datetime"
  | "date"
  | "boolean"
  | "select"
  | "image";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  placeholder?: string;
  /** Rendered under the input — use for anything non-obvious. */
  hint?: string;
}

export interface TableDef {
  /**
   * Supabase table name, constrained to the write allowlist — that constraint
   * is also what lets the typed client accept it without a cast.
   */
  table: WritableTable;
  /** Tab label. */
  title: string;
  /** The clock hour this content drives, if any. */
  numeral?: string;
  /** One-line description of where it surfaces. */
  blurb: string;
  fields: FieldDef[];
  /** Values used when creating a new row. */
  defaults: Record<string, unknown>;
  /** Column used for the row's headline in the list. */
  labelKey: string;
  /** Ordering applied when reading. */
  orderBy: { column: string; ascending: boolean }[];
  /** When false, the tab is an inbox — no create button. */
  canCreate?: boolean;
  /**
   * When true, rows can only be viewed. Used for `purchases`, which has no
   * admin UPDATE or DELETE policy — offering the buttons would just produce
   * failures.
   */
  readOnly?: boolean;
}

/**
 * Tables the admin may write to. The generic save/delete actions take a table
 * name from the client, so this allowlist is what stops that being an
 * arbitrary-write primitive. RLS is still the real boundary; this is defence
 * in depth and keeps a typo from reaching the database.
 */
export const WRITABLE_TABLES = [
  "music_releases",
  "merch_products",
  "events",
  "gallery_items",
  "press_features",
  "contact_submissions",
  "blog_posts",
  "music_products",
  "outreach_logs",
  "purchases",
] as const;

export type WritableTable = (typeof WRITABLE_TABLES)[number];

export const isWritableTable = (name: string): name is WritableTable =>
  (WRITABLE_TABLES as readonly string[]).includes(name);

export const ADMIN_TABLES: TableDef[] = [
  {
    table: "music_releases",
    title: "Music",
    numeral: "IV",
    blurb:
      "Albums and tracks. Only rows with a YouTube link appear on the site — Spotify and Apple links are stored but cannot be embedded.",
    labelKey: "title",
    orderBy: [
      { column: "sort_order", ascending: true },
      { column: "created_at", ascending: true },
    ],
    fields: [
      { key: "title", label: "Title", type: "text" },
      {
        key: "release_type",
        label: "Type",
        type: "select",
        options: ["track", "album"],
      },
      {
        key: "platform",
        label: "Platform",
        type: "select",
        options: ["youtube", "spotify", "apple_music", "itunes"],
      },
      {
        key: "platform_link",
        label: "Link",
        type: "url",
        placeholder: "https://www.youtube.com/watch?v=…",
        hint: "YouTube watch, youtu.be, shorts or embed URLs all work.",
      },
      {
        key: "parent_album_id",
        label: "Parent album ID",
        type: "text",
        hint: "Leave blank for a standalone release. Paste an album's ID to nest this track under it.",
      },
      { key: "artwork_url", label: "Artwork", type: "image" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "sort_order", label: "Sort order", type: "number" },
    ],
    defaults: {
      title: "",
      release_type: "track",
      platform: "youtube",
      platform_link: "",
      artwork_url: "",
      description: "",
      sort_order: 0,
    },
  },
  {
    table: "merch_products",
    title: "Store",
    numeral: "VI",
    blurb: "Merch. Only products marked active are shown.",
    labelKey: "title",
    orderBy: [{ column: "created_at", ascending: false }],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "price", label: "Price", type: "number" },
      {
        key: "meta",
        label: "Material",
        type: "text",
        placeholder: "Cotton 220gsm",
        hint: "Shown under the product name. Defaults to “Limited Release” if blank.",
      },
      { key: "image_url", label: "Image", type: "image" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    defaults: {
      title: "",
      price: 0,
      meta: "",
      image_url: "",
      active: true,
    },
  },
  {
    table: "events",
    title: "Events",
    numeral: "VIII",
    blurb:
      "Shows. Only published events in the future appear — past dates drop off on their own.",
    labelKey: "title",
    orderBy: [{ column: "date_time", ascending: true }],
    fields: [
      { key: "title", label: "Title", type: "text" },
      {
        key: "date_time",
        label: "Date & time",
        type: "datetime",
        hint: "Entered and displayed in New York time.",
      },
      { key: "location", label: "Location", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "ticket_link", label: "Ticket link", type: "url" },
      { key: "image_url", label: "Image", type: "image" },
      { key: "published", label: "Published", type: "boolean" },
    ],
    defaults: {
      title: "",
      date_time: "",
      location: "",
      description: "",
      ticket_link: "",
      image_url: "",
      published: true,
    },
  },
  {
    table: "gallery_items",
    title: "Archive",
    numeral: "X",
    blurb: "The archive grid inside Contact. Images only.",
    labelKey: "alt",
    orderBy: [
      { column: "sort_order", ascending: true },
      { column: "created_at", ascending: true },
    ],
    fields: [
      {
        key: "alt",
        label: "Caption",
        type: "text",
        hint: "Also used as the image's alt text — describe what is shown.",
      },
      { key: "meta", label: "Meta", type: "text", placeholder: "Studio · 2026" },
      { key: "image_url", label: "Image", type: "image" },
      {
        key: "media_type",
        label: "Media type",
        type: "select",
        options: ["image", "video", "youtube", "youtube_short"],
        hint: "Only “image” rows are rendered on the new site.",
      },
      { key: "sort_order", label: "Sort order", type: "number" },
    ],
    defaults: {
      alt: "",
      meta: "",
      image_url: "",
      media_type: "image",
      sort_order: 0,
    },
  },
  {
    table: "press_features",
    title: "Press",
    numeral: "XI",
    blurb: "Editorial coverage. Only published rows with a link are shown.",
    labelKey: "headline",
    orderBy: [
      { column: "sort_order", ascending: true },
      { column: "created_at", ascending: true },
    ],
    fields: [
      { key: "outlet", label: "Outlet", type: "text", placeholder: "BET" },
      { key: "headline", label: "Headline", type: "text" },
      { key: "url", label: "Article URL", type: "url" },
      { key: "published_at", label: "Published", type: "date" },
      { key: "sort_order", label: "Sort order", type: "number" },
      { key: "published", label: "Published", type: "boolean" },
    ],
    defaults: {
      outlet: "",
      headline: "",
      url: "",
      published_at: "",
      sort_order: 0,
      published: true,
    },
  },
  {
    table: "contact_submissions",
    title: "Submissions",
    blurb: "Messages from the Contact form. Read-only, apart from marking read.",
    labelKey: "subject",
    canCreate: false,
    orderBy: [{ column: "created_at", ascending: false }],
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "subject", label: "Subject", type: "text" },
      { key: "message", label: "Message", type: "textarea" },
      { key: "read", label: "Read", type: "boolean" },
    ],
    defaults: {},
  },

  /*
   * ── Not on the clock ───────────────────────────────────────────────────
   * These carry over from the legacy site, which had a page per section. The
   * new site has no blog or checkout surface yet, so editing them here changes
   * the database but nothing visible on cheytime.com. They are kept so this
   * panel is a complete replacement for the old one rather than a subset.
   */
  {
    table: "blog_posts",
    title: "Blog",
    blurb:
      "Carried over from the legacy site. Not rendered on the clock — there is no blog section yet.",
    labelKey: "title",
    orderBy: [{ column: "date", ascending: false }],
    fields: [
      { key: "title", label: "Title", type: "text" },
      {
        key: "slug",
        label: "Slug",
        type: "text",
        hint: "URL fragment. Must be unique.",
      },
      { key: "date", label: "Date", type: "date" },
      { key: "excerpt", label: "Excerpt", type: "textarea" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "thumbnail_url", label: "Thumbnail", type: "image" },
      { key: "external_url", label: "External URL", type: "url" },
    ],
    defaults: {
      title: "",
      slug: "",
      date: "",
      excerpt: "",
      body: "",
      thumbnail_url: "",
      external_url: "",
    },
  },
  {
    table: "music_products",
    title: "Digital",
    blurb:
      "Paid downloads behind Stripe checkout. The checkout functions still run from the legacy repo, so these are not purchasable from the new site yet.",
    labelKey: "title",
    orderBy: [{ column: "created_at", ascending: false }],
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "artist", label: "Artist", type: "text" },
      { key: "price", label: "Price", type: "number" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "cover_url", label: "Cover", type: "image" },
      {
        key: "audio_url",
        label: "Audio URL",
        type: "url",
        hint: "Full track, delivered after purchase. Lives in the private music-files bucket.",
      },
      { key: "preview_audio_url", label: "Preview URL", type: "url" },
      { key: "active", label: "Active", type: "boolean" },
    ],
    defaults: {
      title: "",
      artist: "",
      price: 0,
      description: "",
      cover_url: "",
      audio_url: "",
      preview_audio_url: "",
      active: true,
    },
  },
  {
    table: "outreach_logs",
    title: "Outreach",
    blurb: "Internal PR pipeline. Admin-only — never shown publicly.",
    labelKey: "contact_name",
    orderBy: [{ column: "created_at", ascending: false }],
    fields: [
      { key: "contact_name", label: "Contact", type: "text" },
      { key: "topic", label: "Topic", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["pending", "sent", "responded", "published", "declined"],
      },
      { key: "publication_link", label: "Publication link", type: "url" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    defaults: {
      contact_name: "",
      topic: "",
      status: "pending",
      publication_link: "",
      notes: "",
    },
  },
  {
    table: "purchases",
    title: "Purchases",
    blurb:
      "Stripe orders, written by the webhook. Read-only: there is no admin update or delete policy on this table.",
    labelKey: "email",
    canCreate: false,
    readOnly: true,
    orderBy: [{ column: "created_at", ascending: false }],
    fields: [
      { key: "email", label: "Email", type: "text" },
      { key: "item_type", label: "Item type", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "total", label: "Total", type: "number" },
      { key: "stripe_session_id", label: "Stripe session", type: "text" },
    ],
    defaults: {},
  },
];
