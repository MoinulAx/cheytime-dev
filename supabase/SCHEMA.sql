-- ═══════════════════════════════════════════════════════════════════════════
-- Chey Time — full Supabase schema, current state
-- Project: enhduflezmiugpjaovhz
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ⚠️ REFERENCE ONLY — DO NOT RUN THIS FILE.
--
-- This is the whole database in one place so it can be read without stitching
-- together twelve migrations. The files in ./migrations are what actually runs
-- and remain the source of truth; this is regenerated to match them.
--
-- One database serves two codebases:
--   • cheytime-dev  (this repo)  — Next.js clock + /admin
--   • cheytime-old  (legacy)     — Vite app + the deployed edge functions
--
-- RLS shape, consistent across every content table:
--   • public SELECT — sometimes narrowed to published = true
--   • ALL WRITES gated behind has_role(auth.uid(), 'admin')
-- That is why the admin needs no policies of its own, and why shipping the
-- anon key to the browser is safe.
--
-- ═══════════════════════════════════════════════════════════════════════════


-- ── ROLES ──────────────────────────────────────────────────────────────────

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
-- Only 'admin' grants anything. The other two are unused by both apps.

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
-- RLS: users may read their own rows only. No self-service writes — granting
-- admin is a manual SQL step, see ADMIN_PLAN.md §3.7.

-- SECURITY DEFINER so policies can call it without recursing through
-- user_roles' own RLS.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- CONTENT THE CLOCK RENDERS
-- Each block notes the hour it feeds and the loader that reads it.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── site_settings — copy across Home XII, About II, Music IV, Contact X ────
-- Read by lib/loaders/settings.ts. Key/value because these are unrelated
-- sentences spread across four sections; a column per string would need a
-- migration every time the client wants to say something new.
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',      -- human label shown in the admin
  section_id text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
-- Keys in use:
--   home.tagline · home.location · home.intro · home.cue
--   home.fact.based · home.fact.genre · home.fact.latest · home.fact.direction
--   about.bio (paragraphs split on blank lines) · about.quote
--   music.channelLabel · music.channelUrl
--   contact.email · contact.blurb · contact.sla
-- RLS: public SELECT · admin write.

-- ── site_sections — every panel's shell ───────────────────────────────────
-- Read by lib/loaders/chrome.ts. A blank cell means "keep the built-in
-- wording", so clearing a field cannot blank a heading by accident.
CREATE TABLE public.site_sections (
  section_id text PRIMARY KEY,          -- home, blog, about, music, store,
                                        -- digital, events, gallery, contact, press
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '', -- intro line inside the panel
  note text NOT NULL DEFAULT '',        -- small italic line at the foot
  empty_message text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  image_alt text NOT NULL DEFAULT '',
  image_meta text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write.

-- ── about_credits — About II ──────────────────────────────────────────────
CREATE TABLE public.about_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write.

-- ── music_releases — Music IV (primary) ───────────────────────────────────
-- Read by lib/loaders/music.ts. Shallow tree: albums have no parent, tracks
-- point at one. Only rows whose platform_link yields a YouTube id can be
-- embedded; Spotify/Apple rows are stored but dropped at the fetch layer.
CREATE TABLE public.music_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  release_type text NOT NULL DEFAULT 'track',    -- 'track' | 'album'
  platform text NOT NULL DEFAULT 'youtube',      -- youtube|spotify|apple_music|itunes
  platform_link text NOT NULL DEFAULT '',
  artwork_url text DEFAULT '',
  audio_url text DEFAULT '',
  description text DEFAULT '',
  parent_album_id uuid REFERENCES public.music_releases(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write.

-- ── music_links — Music IV (fallback) ─────────────────────────────────────
-- The older YouTube-only table. loadMusic() reads it only when
-- music_releases is empty, which is the case today.
CREATE TABLE public.music_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  youtube_id text NOT NULL,
  itunes_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write.

-- ── merch_products — Store VI ─────────────────────────────────────────────
-- `meta` is the material line under the product name.
CREATE TABLE public.merch_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  meta text DEFAULT '',
  image_url text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write. Only active = true is rendered.

-- ── merch_product_images — extra shots per product ────────────────────────
-- Managed inline from the Store tab. The clock renders only the parent's
-- image_url; these back the legacy store's carousel.
CREATE TABLE public.merch_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merch_product_id uuid NOT NULL
    REFERENCES public.merch_products(id) ON DELETE CASCADE,
  image_url text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write.

-- ── music_products — Digital VII ──────────────────────────────────────────
-- Paid downloads. Only preview_audio_url reaches the browser; audio_url is
-- the file being sold and is released by the secure-download function.
CREATE TABLE public.music_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  audio_url text DEFAULT '',
  preview_audio_url text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write.

-- ── events — Events VIII ──────────────────────────────────────────────────
-- Times are entered and displayed in America/New_York.
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date_time timestamptz NOT NULL,
  location text NOT NULL DEFAULT '',
  description text DEFAULT '',
  ticket_link text DEFAULT '',
  image_url text DEFAULT '',
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT **narrowed to published = true** · admins read all ·
-- admin write. The site additionally filters date_time >= now().

-- ── gallery_items — Gallery IX ────────────────────────────────────────────
-- Every photograph on the clock. `collection` is historical only — Gallery
-- renders all rows regardless. Rows with no image_url are invisible.
CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alt text NOT NULL,                              -- caption + alt text
  meta text,
  image_url text DEFAULT '',
  media_type text NOT NULL DEFAULT 'image',       -- only 'image' is rendered
  aspect_ratio text DEFAULT 'landscape',
  collection text NOT NULL DEFAULT 'archive',     -- unused, see above
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX gallery_items_collection_idx ON public.gallery_items (collection, sort_order);
-- RLS: public SELECT · admin write.

-- ── social_links — Contact X ──────────────────────────────────────────────
-- A NULL url is meaningful: it renders a greyed "· soon" chip, not a dead link.
CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '',
  url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write.

-- ── press_features — Press XI ─────────────────────────────────────────────
CREATE TABLE public.press_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet text NOT NULL,
  headline text NOT NULL,
  url text NOT NULL DEFAULT '',
  published_at date,
  sort_order integer DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT narrowed to published = true · admins read all ·
-- admin write. Rows without a url are dropped at the fetch layer.

-- ── blog_posts — Journal I ────────────────────────────────────────────────
-- NOTE: `date` is TEXT, not a date type. Seeded rows use '2026.02.27'; the
-- admin's date input produces '2026-02-27'. lib/loaders/blog.ts normalises
-- both and passes anything else through untouched.
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL,
  body text NOT NULL,
  date text NOT NULL,
  external_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write.
-- The clock has no per-post route, so a post is only a link when it carries
-- an external_url.


-- ═══════════════════════════════════════════════════════════════════════════
-- NOT RENDERED PUBLICLY
-- ═══════════════════════════════════════════════════════════════════════════

-- ── contact_submissions — the Contact form's inbox ────────────────────────
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
-- RLS: anon+authenticated INSERT (that is how the form posts) ·
-- SELECT/UPDATE/DELETE admin only. Nothing is readable back from the browser.

-- ── outreach_logs — internal PR pipeline ──────────────────────────────────
CREATE TABLE public.outreach_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  topic text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',  -- pending|sent|responded|published|declined
  publication_link text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
-- RLS: admin only, all operations. Never public.

-- ── purchases — written by the Stripe webhook ─────────────────────────────
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  item_type text NOT NULL DEFAULT 'merch',
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);
-- RLS: admin SELECT · unrestricted INSERT (the webhook).
-- ⚠️ No admin UPDATE or DELETE policy exists — the admin treats this as
-- read-only, because offering those buttons would only produce failures.

-- ── download_tokens — post-purchase delivery ──────────────────────────────
CREATE TABLE public.download_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.purchases(id),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  email text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  downloaded_at timestamptz,
  created_at timestamptz DEFAULT now()
);
-- RLS: anon may read/insert/update (the token itself is the secret) ·
-- admins read all.

-- ── social_embeds — legacy embed URLs, unused by the clock ────────────────
CREATE TABLE public.social_embeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_type text NOT NULL DEFAULT 'instagram',  -- 'instagram' | 'youtube'
  url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- RLS: public SELECT · admin write.
-- Distinct from social_links: these are embeddable posts, those are profiles.

-- ── analytics (legacy site only) ──────────────────────────────────────────
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT '/',
  viewed_at timestamptz NOT NULL DEFAULT now(),
  session_id text
);

CREATE TABLE public.site_stats (
  id integer PRIMARY KEY CHECK (id = 1),
  total_views bigint NOT NULL DEFAULT 0,
  unique_visitors bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.view_throttle (
  session_id text NOT NULL,
  page text NOT NULL,
  last_view timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, page)
);

CREATE FUNCTION public.record_page_view(p_page text, p_session text) RETURNS void;
-- Throttled view counter. The clock does not call it.


-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE
-- ═══════════════════════════════════════════════════════════════════════════
--
--   site-assets   public = true   images: gallery, artwork, products
--   music-files   public = true   audio: full tracks and preview clips
--
-- ⚠️ BOTH BUCKETS ARE PUBLIC. music-files does not withhold a paid track from
-- anyone holding its URL — secure-download issues tokens, but the bucket does
-- not check them. The site never renders audio_url, so the URLs are not
-- discoverable from the page, but that is obscurity, not access control.
--
-- Storage RLS: public SELECT on both · admin-only INSERT/UPDATE/DELETE.
--
-- next.config.ts allows *.supabase.co/storage/v1/object/public/** through
-- next/image. Signed URLs (/object/sign/) are NOT allowed and would throw —
-- lib/loaders/images.ts drops them at the fetch layer.


-- ═══════════════════════════════════════════════════════════════════════════
-- EDGE FUNCTIONS — deployed from the LEGACY repo, not this one
-- ═══════════════════════════════════════════════════════════════════════════
--
--   admin-auth               verifies the JWT and checks the admin role with
--                            the service role. This site's guard calls its
--                            'login-check' action, falling back to a direct
--                            user_roles read if unreachable.
--   create-checkout-session  Stripe. Not wired to the clock.
--   stripe-webhook           writes purchases.
--   secure-download          issues download tokens for purchased audio.
--
-- The service role key lives only in these functions' environment. It belongs
-- in neither codebase and must never appear in a NEXT_PUBLIC_* var.
