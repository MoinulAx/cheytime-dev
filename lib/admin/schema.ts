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
  | "image"
  | "audio";

/**
 * Storage buckets. Both are `public = true` on this project, so neither one
 * withholds a file from someone holding its URL — `music-files` is separated
 * for organisation and because `secure-download` issues tokens against it, not
 * because the bucket itself restricts reads.
 */
export type StorageBucket = "site-assets" | "music-files";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  placeholder?: string;
  /** Rendered under the input — use for anything non-obvious. */
  hint?: string;
  /** Upload target for `image` / `audio` fields. Defaults to `site-assets`. */
  bucket?: StorageBucket;
  /**
   * Send `null` when the field is left blank.
   *
   * Only for columns where an empty string cannot be cast — uuid, date,
   * timestamp. Most text columns here are `NOT NULL DEFAULT ''`, so blanking
   * them must write `''`; writing `null` instead trips the not-null
   * constraint and surfaces as a confusing database error.
   */
  nullable?: boolean;
}

/** A one-to-many child table edited inline from its parent's row. */
export interface ChildTableDef {
  table: WritableTable;
  /** Column on the child holding the parent's id. */
  foreignKey: string;
  title: string;
  /** Column holding the image URL. */
  imageKey: string;
  /** Column used to order the strip, if any. */
  sortKey?: string;
  bucket?: StorageBucket;
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
  /** Extra images (or similar) managed inline against each row. */
  child?: ChildTableDef;
  /**
   * Primary key column. Defaults to `id`; `site_settings` is keyed on `key`,
   * and updating it with an `id` filter would silently match nothing.
   */
  primaryKey?: string;
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
  "merch_product_images",
  "site_settings",
  "about_credits",
  "social_links",
] as const;

export type WritableTable = (typeof WRITABLE_TABLES)[number];

export const isWritableTable = (name: string): name is WritableTable =>
  (WRITABLE_TABLES as readonly string[]).includes(name);

export const ADMIN_TABLES: TableDef[] = [
  {
    table: "site_settings",
    title: "Copy",
    blurb:
      "The written copy across the clock — the Home lines, the About biography and quote, the contact details. Editing a value here changes the site; the key is what the code looks up, so leave it alone.",
    labelKey: "label",
    canCreate: false,
    primaryKey: "key",
    orderBy: [
      { column: "section_id", ascending: true },
      { column: "sort_order", ascending: true },
    ],
    fields: [
      {
        key: "key",
        label: "Key",
        type: "text",
        hint: "Identifier used by the code. Changing it detaches the copy from where it renders.",
      },
      { key: "label", label: "Label", type: "text" },
      {
        key: "value",
        label: "Value",
        type: "textarea",
        hint: "For the biography, separate paragraphs with a blank line.",
      },
      { key: "section_id", label: "Section", type: "text" },
      { key: "sort_order", label: "Sort order", type: "number" },
    ],
    defaults: {},
  },
  {
    table: "about_credits",
    title: "Credits",
    numeral: "II",
    blurb: "The role/name list at the bottom of the About panel.",
    labelKey: "role",
    orderBy: [
      { column: "sort_order", ascending: true },
      { column: "created_at", ascending: true },
    ],
    fields: [
      { key: "role", label: "Role", type: "text", placeholder: "Production" },
      { key: "name", label: "Name", type: "text", placeholder: "Chey" },
      { key: "sort_order", label: "Sort order", type: "number" },
    ],
    defaults: { role: "", name: "", sort_order: 0 },
  },
  {
    table: "social_links",
    title: "Channels",
    numeral: "X",
    blurb:
      "The channel chips on Contact. Leave the URL blank to show the label greyed out as “· soon”.",
    labelKey: "label",
    orderBy: [
      { column: "sort_order", ascending: true },
      { column: "created_at", ascending: true },
    ],
    fields: [
      { key: "label", label: "Label", type: "text", placeholder: "Spotify" },
      {
        key: "url",
        label: "URL",
        type: "url",
        nullable: true,
        hint: "Blank renders the “· soon” chip rather than a dead link.",
      },
      { key: "sort_order", label: "Sort order", type: "number" },
    ],
    defaults: { label: "", url: "", sort_order: 0 },
  },
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
        nullable: true,
        hint: "Leave blank for a standalone release. Paste an album's ID to nest this track under it.",
      },
      { key: "artwork_url", label: "Artwork", type: "image" },
      {
        key: "audio_url",
        label: "Audio",
        type: "audio",
        bucket: "music-files",
        hint: "Optional. The clock embeds the YouTube link above, so this is for reference and future use.",
      },
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
    blurb:
      "Merch. Only products marked active are shown. The clock renders the main image; extra images are stored for the legacy store's carousel.",
    labelKey: "title",
    orderBy: [{ column: "created_at", ascending: false }],
    child: {
      table: "merch_product_images",
      foreignKey: "merch_product_id",
      title: "Extra images",
      imageKey: "image_url",
      sortKey: "sort_order",
      bucket: "site-assets",
    },
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
        nullable: true,
        hint: "Entered and displayed in New York time. Required — an event with no date cannot be saved.",
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
    title: "Gallery",
    numeral: "III · V · IX · X",
    blurb:
      "Every photograph on the clock. The collection decides which hour it appears on. Images only.",
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
        key: "collection",
        label: "Collection",
        type: "select",
        options: ["archive", "videos", "sessions", "reel"],
        hint: "archive → Contact (X) · videos → The Videos (III) · sessions → The Sessions (V) · reel → The Reel (IX)",
      },
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
      collection: "archive",
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
      { key: "published_at", label: "Published", type: "date", nullable: true },
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

  {
    table: "blog_posts",
    title: "Journal",
    numeral: "I",
    blurb:
      "Entries on the clock's Journal hour. A post only becomes a link if it has an external URL — there is no per-post page on the new site.",
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
    numeral: "VII",
    blurb:
      "Paid downloads. Active products show on the clock with their preview clip; the full audio is only released after purchase. Checkout still runs from the legacy repo.",
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
        label: "Full track",
        type: "audio",
        bucket: "music-files",
        hint: "The file being sold. Never sent to the site — released by secure-download after purchase. Note the bucket is public, so treat the URL itself as the secret.",
      },
      {
        key: "preview_audio_url",
        label: "Preview clip",
        type: "audio",
        bucket: "music-files",
        hint: "Plays publicly on the Digital hour (VII). Upload a short excerpt, not the full track.",
      },
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
