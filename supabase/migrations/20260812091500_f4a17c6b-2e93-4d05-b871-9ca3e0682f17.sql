-- Hour I, Upcoming. What is next, rather than what is out.
--
-- The dial's last free numeral. Music (IV) and Album (III) are catalogue: both
-- read `music_releases`, and both need a thing to exist before they can show
-- it. An announcement is the opposite, a title, a date that may not be fixed,
-- a poster, and often no playable audio at all. Forcing that into
-- `music_releases` would mean `platform_link` doing double duty as a pre-save
-- URL and every catalogue query learning to exclude rows that are not out yet.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.upcoming_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  -- Null is meaningful: announced with no date confirmed. The site says
  -- "Coming soon" rather than inventing one.
  release_date date,
  -- announced · preorder · out
  status text NOT NULL DEFAULT 'announced',
  -- The poster / single artwork.
  artwork_url text NOT NULL DEFAULT '',
  -- Where it can be heard or pre-saved, once there is somewhere.
  link_url text NOT NULL DEFAULT '',
  link_label text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.upcoming_releases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published upcoming" ON public.upcoming_releases;
CREATE POLICY "Public can read published upcoming" ON public.upcoming_releases FOR SELECT TO anon, authenticated USING (published = true);
DROP POLICY IF EXISTS "Admins can read all upcoming" ON public.upcoming_releases;
CREATE POLICY "Admins can read all upcoming" ON public.upcoming_releases FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can insert upcoming" ON public.upcoming_releases;
CREATE POLICY "Admins can insert upcoming" ON public.upcoming_releases FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update upcoming" ON public.upcoming_releases;
CREATE POLICY "Admins can update upcoming" ON public.upcoming_releases FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can delete upcoming" ON public.upcoming_releases;
CREATE POLICY "Admins can delete upcoming" ON public.upcoming_releases FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ── The section's chrome, and its place on the dial ──────────────────────
INSERT INTO public.site_sections (
  section_id, title, subtitle, description, empty_message, hour_index, sort_order
)
VALUES (
  'upcoming',
  'Upcoming',
  'What''s Next',
  '',
  'Nothing announced right now. New releases are posted here first.',
  1,
  1
)
ON CONFLICT (section_id) DO NOTHING;

-- ── Seed: Orange Peel ────────────────────────────────────────────────────
-- Title only. The client named this single directly, so the title is theirs.
-- The link and the poster are deliberately blank: two YouTube URLs were shared
-- but neither could be confirmed as this track, and putting the wrong video
-- behind a song title is the exact mistake that had to be undone in
-- `music_links` once already (see CONTENT_MAP.md). Paste both in the admin,
-- the row renders as an announcement without them.
INSERT INTO public.upcoming_releases (title, status, sort_order, description)
SELECT 'Orange Peel', 'announced', 1, ''
WHERE NOT EXISTS (
  SELECT 1 FROM public.upcoming_releases WHERE lower(title) = 'orange peel'
);
