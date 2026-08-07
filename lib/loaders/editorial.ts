import type { SectionData, SocialLink } from "@/types/section";
import { text, withSupabase } from "./utils";
import { setting, type SiteSettings } from "./settings";

type HomeData = Extract<SectionData, { kind: "home" }>;
type AboutData = Extract<SectionData, { kind: "about" }>;
type ContactData = Extract<SectionData, { kind: "contact" }>;
type MusicData = Extract<SectionData, { kind: "music" }>;

/** Home (XII) — copy and the data strip, all from `site_settings`. */
export function applyHome(fallback: HomeData, s: SiteSettings): HomeData {
  // The strip's labels are fixed; only the values are editable, so each is a
  // settings key rather than a table. A blank value drops that pair entirely
  // instead of rendering a label with nothing under it.
  const facts = fallback.facts.flatMap((fact) => {
    const value = s[`home.fact.${fact.label.toLowerCase()}`] ?? fact.value;
    return value ? [{ label: fact.label, value }] : [];
  });

  return {
    kind: "home",
    tagline: setting(s, "home.tagline", fallback.tagline),
    location: setting(s, "home.location", fallback.location),
    intro: setting(s, "home.intro", fallback.intro),
    cue: setting(s, "home.cue", fallback.cue),
    facts,
  };
}

/**
 * About (II) — copy from `site_settings`, credits from `about_credits`.
 *
 * The bio is stored as one block and split on blank lines, so the client edits
 * it in a single textarea instead of managing numbered paragraph rows.
 */
export async function loadAbout(
  fallback: AboutData,
  s: SiteSettings,
): Promise<AboutData> {
  const raw = s["about.bio"];
  const bio = raw
    ? raw
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : fallback.bio;

  const credits = await withSupabase("loadAbout", async (db) => {
    const { data, error } = await db
      .from("about_credits")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    return (data ?? []).flatMap((row) => {
      const role = text(row.role);
      const name = text(row.name);
      return role && name ? [{ role, name }] : [];
    });
  });

  return {
    kind: "about",
    bio: bio.length > 0 ? bio : fallback.bio,
    quote: setting(s, "about.quote", fallback.quote),
    credits: credits && credits.length > 0 ? credits : fallback.credits,
  };
}

/** Music (IV) — the channel strings; videos come from `loadMusic`. */
export function applyMusicChannel(
  data: MusicData,
  s: SiteSettings,
): MusicData {
  return {
    ...data,
    channelLabel: setting(s, "music.channelLabel", data.channelLabel),
    channelUrl: setting(s, "music.channelUrl", data.channelUrl),
  };
}

/**
 * Contact (X) — address and channel list.
 *
 * No photographs here any more: the grid that used to sit in this panel was a
 * fourth view of `gallery_items`, and the Gallery section owns them now.
 */
export async function applyContact(
  data: ContactData,
  s: SiteSettings,
): Promise<ContactData> {
  const socials = await withSupabase("loadSocialLinks", async (db) => {
    const { data: rows, error } = await db
      .from("social_links")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    return (rows ?? []).flatMap((row) => {
      const label = text(row.label);
      // A null url is meaningful — it renders as a "· soon" chip.
      return label ? [{ label, url: text(row.url) ?? null }] : [];
    }) as SocialLink[];
  });

  return {
    kind: "contact",
    email: setting(s, "contact.email", data.email),
    blurb: setting(s, "contact.blurb", data.blurb),
    sla: setting(s, "contact.sla", data.sla),
    socials: socials && socials.length > 0 ? socials : data.socials,
  };
}
