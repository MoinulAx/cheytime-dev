-- Make the last hard-coded sections editable.
--
-- Music, Store, Events, Archive, Press, Journal and Digital already read from
-- tables. Home, About, the gallery chapters and every section's title /
-- subtitle / panel image were still compiled into the bundle, so changing a
-- line of copy meant a deploy. These four changes close that.
--
-- Seeds reproduce exactly what is in lib/sections.static.ts today, so applying
-- this migration changes nothing visible — it only moves the content.

-- ── 1. Free-text copy that isn't a list ────────────────────────────────────
-- Key/value rather than a column per string: these are a handful of unrelated
-- sentences spread across four sections, and a wide one-row table would need a
-- migration every time the client wants to say something new.
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  section_id text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read settings" ON public.site_settings;
CREATE POLICY "Public can read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert settings" ON public.site_settings;
CREATE POLICY "Admins can insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete settings" ON public.site_settings;
CREATE POLICY "Admins can delete settings" ON public.site_settings FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (key, value, label, section_id, sort_order) VALUES
  ('home.tagline',      'Hip Hop''s Princess', 'Tagline', 'home', 1),
  ('home.location',     'Staten Island, New York', 'Location', 'home', 2),
  ('home.intro',        'Relatable lyricism over upbeat, captivating production. Stream the sound, step into the archive, and catch what comes next — on Chey''s time.', 'Intro', 'home', 3),
  ('home.cue',          'Choose an hour to begin', 'Cue', 'home', 4),
  ('about.bio',         'Chey. Architect of sound — blending raw, relatable lyricism with heavy, captivating production.

Born from a rejection of the polished and predictable. In a landscape saturated with overproduced noise, the choice was rawness. In a world addicted to trends, the choice was substance.

Every release is a document of a specific tension — silence against static, restraint against aggression. The work lives at the intersection of sound and vision.', 'Biography (blank line between paragraphs)', 'about', 1),
  ('about.quote',       'The mic captures the exact frequency of the room. The imperfections are intentional.', 'Pull quote', 'about', 2),
  ('music.channelLabel','@CheyMusic127', 'YouTube handle', 'music', 1),
  ('music.channelUrl',  'https://www.youtube.com/@CheyMusic127', 'YouTube URL', 'music', 2),
  ('contact.email',     'Smgproductions2024@gmail.com', 'Contact email', 'contact', 1),
  ('contact.blurb',     'For bookings, press, and collaboration.', 'Blurb', 'contact', 2),
  ('contact.sla',       'Responses within 48 hours.', 'Response time', 'contact', 3)
ON CONFLICT (key) DO NOTHING;

-- ── 2. About credits ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.about_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.about_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read credits" ON public.about_credits;
CREATE POLICY "Public can read credits" ON public.about_credits FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert credits" ON public.about_credits;
CREATE POLICY "Admins can insert credits" ON public.about_credits FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update credits" ON public.about_credits;
CREATE POLICY "Admins can update credits" ON public.about_credits FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete credits" ON public.about_credits;
CREATE POLICY "Admins can delete credits" ON public.about_credits FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.about_credits (role, name, sort_order) VALUES
  ('Artist', 'Chey', 1),
  ('Production', 'Chey', 2),
  ('Direction', 'Chey', 3),
  ('Visuals', 'rummspace', 4),
  ('Web', 'rummspace', 5)
ON CONFLICT DO NOTHING;

-- ── 3. Contact channel links ───────────────────────────────────────────────
-- `social_embeds` holds embeddable post URLs; these are plain profile links,
-- and a null url is meaningful — it renders as a "· soon" chip.
CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '',
  url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read social links" ON public.social_links;
CREATE POLICY "Public can read social links" ON public.social_links FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert social links" ON public.social_links;
CREATE POLICY "Admins can insert social links" ON public.social_links FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update social links" ON public.social_links;
CREATE POLICY "Admins can update social links" ON public.social_links FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete social links" ON public.social_links;
CREATE POLICY "Admins can delete social links" ON public.social_links FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.social_links (label, url, sort_order) VALUES
  ('YouTube',     'https://www.youtube.com/@CheyMusic127', 1),
  ('Instagram',   'https://www.instagram.com/imchey__/',   2),
  ('TikTok',      'https://www.tiktok.com/@cheymusic',     3),
  ('Spotify',     NULL, 4),
  ('Apple Music', NULL, 5)
ON CONFLICT DO NOTHING;

-- ── 4. Group gallery images into chapters ──────────────────────────────────
-- Existing rows are the Contact archive, so 'archive' is the right default and
-- no seeded row changes meaning.
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS collection text NOT NULL DEFAULT 'archive';

CREATE INDEX IF NOT EXISTS gallery_items_collection_idx
  ON public.gallery_items (collection, sort_order);

-- The three gallery chapters, built from YouTube stills of Chey's own videos.
--
-- Guarded per collection rather than with ON CONFLICT: gallery_items has no
-- unique constraint for ON CONFLICT to key off, so a plain re-run would insert
-- all sixteen rows a second time. Seeding only when a chapter is empty makes
-- this safe to apply repeatedly, and means it will never overwrite chapters the
-- client has since curated in the admin.
INSERT INTO public.gallery_items (alt, meta, image_url, media_type, collection, sort_order)
SELECT v.alt, v.meta, v.image_url, 'image', v.collection, v.sort_order
FROM (VALUES
  ('Chey — Poppin'' video still', 'Music Video · 2026', 'https://i.ytimg.com/vi/29vWUXMTkME/hq1.jpg', 'videos', 1),
  ('Chey — Poppin'' video still', 'Music Video · 2026', 'https://i.ytimg.com/vi/29vWUXMTkME/hq2.jpg', 'videos', 2),
  ('Chey — Poppin'' video still', 'Music Video · 2026', 'https://i.ytimg.com/vi/29vWUXMTkME/hq3.jpg', 'videos', 3),
  ('Chey — Long Kiss Goodnight video still', 'Music Video · 2025', 'https://i.ytimg.com/vi/OamCSPuswjg/hq1.jpg', 'videos', 4),
  ('Chey — Long Kiss Goodnight video still', 'Music Video · 2025', 'https://i.ytimg.com/vi/OamCSPuswjg/hq2.jpg', 'videos', 5),
  ('Chey — Long Kiss Goodnight video still', 'Music Video · 2025', 'https://i.ytimg.com/vi/OamCSPuswjg/hq3.jpg', 'videos', 6),
  ('Chey — Session III still', 'Session · YouTube', 'https://i.ytimg.com/vi/4T6mFd2Sz_Y/hq1.jpg', 'sessions', 1),
  ('Chey — Session III still', 'Session · YouTube', 'https://i.ytimg.com/vi/4T6mFd2Sz_Y/hq2.jpg', 'sessions', 2),
  ('Chey — Session III still', 'Session · YouTube', 'https://i.ytimg.com/vi/4T6mFd2Sz_Y/hq3.jpg', 'sessions', 3),
  ('Chey — Session IV still', 'Session · YouTube', 'https://i.ytimg.com/vi/l62mMBXck70/hq1.jpg', 'sessions', 4),
  ('Chey — Session IV still', 'Session · YouTube', 'https://i.ytimg.com/vi/l62mMBXck70/hq2.jpg', 'sessions', 5),
  ('Chey — Session IV still', 'Session · YouTube', 'https://i.ytimg.com/vi/l62mMBXck70/hq3.jpg', 'sessions', 6),
  ('Chey — Poppin'' video still', '2026', 'https://i.ytimg.com/vi/29vWUXMTkME/hq2.jpg', 'reel', 1),
  ('Chey — Long Kiss Goodnight video still', '2025', 'https://i.ytimg.com/vi/OamCSPuswjg/hq1.jpg', 'reel', 2),
  ('Chey — Session III still', 'YouTube', 'https://i.ytimg.com/vi/4T6mFd2Sz_Y/hq2.jpg', 'reel', 3),
  ('Chey — Session IV still', 'YouTube', 'https://i.ytimg.com/vi/l62mMBXck70/hq3.jpg', 'reel', 4)
) AS v(alt, meta, image_url, collection, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.gallery_items g WHERE g.collection = v.collection
);
