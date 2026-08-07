-- Last of the local content, and one gallery instead of four.
--
-- Two changes:
--
-- 1. site_sections — each section's title, subtitle, panel image and
--    supporting lines. These were the final strings compiled into the bundle,
--    so changing a section heading still meant a deploy.
--
-- 2. The photographs were split across four surfaces — gallery chapters on
--    III, V and IX, plus a grid inside Contact — which were four views of the
--    same table. They are now a single Gallery section at IX that reads every
--    row, so `gallery_items.collection` no longer decides where a photo
--    appears. The column is left in place (harmless, and it still records how
--    a row was grouped) but nothing reads it.
--
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.site_sections (
  section_id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  empty_message text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  image_alt text NOT NULL DEFAULT '',
  image_meta text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read sections" ON public.site_sections;
CREATE POLICY "Public can read sections" ON public.site_sections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert sections" ON public.site_sections;
CREATE POLICY "Admins can insert sections" ON public.site_sections FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update sections" ON public.site_sections;
CREATE POLICY "Admins can update sections" ON public.site_sections FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete sections" ON public.site_sections;
CREATE POLICY "Admins can delete sections" ON public.site_sections FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- One row per clock hour. Blank cells mean "keep the built-in wording", so
-- only the fields a section actually uses are filled in.
INSERT INTO public.site_sections
  (section_id, title, subtitle, description, note, empty_message, image_url, image_alt, image_meta, sort_order) VALUES
  ('home',    'Chey''s Time', 'Hip Hop''s Princess', '', '', '', '', '', '', 0),
  ('blog',    'Journal', 'Dispatches',
              'Notes, announcements and long-form from Chey and the team.', '',
              'No entries yet. Announcements and long-form land here first.',
              '/assets/editorial-2.jpg', 'Chey — editorial portrait', 'Journal · Written', 1),
  ('about',   'About', 'The Manifesto', '', '', '',
              '/assets/chey-braids.jpg', 'Chey — portrait', 'Portrait · Staten Island', 2),
  ('music',   'Music', 'The Sound', '',
              'Spotify & Apple Music links coming soon.', '',
              '/assets/chey-furhat.jpg', 'Chey — portrait', 'Portrait · The Sound', 4),
  ('store',   'Store', 'The Objects', '',
              'Secure checkout returns soon. Reserve a piece and we''ll hold it.', '',
              '', '', '', 6),
  ('digital', 'Digital', 'Downloads',
              'Buy the record outright — yours to keep, no stream needed.',
              'Checkout runs from the legacy store while payments are being moved across.',
              'Nothing on sale right now. New drops are announced here and on the Journal.',
              '/assets/chey-earring.jpg', 'Chey — portrait', 'Digital · Downloads', 7),
  ('events',  'Events', 'Upcoming', '', '',
              'No dates on the calendar right now. New shows are announced here first — check back soon.',
              '/assets/editorial-3.jpg', 'Chey — editorial portrait', 'Live · Coming Soon', 8),
  ('gallery', 'Gallery', 'The Archive', 'Every frame, in one place.', '',
              '', '/assets/chey-furhat.jpg', 'Chey — portrait', 'Archive · Photography', 9),
  ('contact', 'Contact', 'Transmission', '', '', '',
              '/assets/editorial-1.jpg', 'Chey — editorial portrait', 'Open Line · 48hr Reply', 10),
  ('press',   'Press', 'The Record', 'Where the work has been written about.', '',
              'Coverage is being gathered. Press enquiries are welcome — the line is open on X.',
              '/assets/chey-mediakit.jpg', 'Chey — 2024 media kit cover', 'Press · Media Kit', 11)
ON CONFLICT (section_id) DO NOTHING;

COMMENT ON COLUMN public.gallery_items.collection IS
  'Historical grouping only. The Gallery section renders every row regardless '
  'of this value — kept so the original chaptering is not lost.';
