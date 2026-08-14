-- Copy pass on the database: em dashes out, and "Transmission" replaced with
-- language that suits a hip hop artist rather than a radio operator.
--
-- Most of what a visitor reads lives in these tables, not in the bundle, so
-- cleaning the code alone would have left the em dashes on screen.
--
-- Two stages. First, named rewrites where a comma is not the right answer and
-- the sentence needed restructuring. Then a general sweep over every
-- user-visible text column, so anything edited in the admin since launch is
-- caught too. The sweep is deliberately conservative: an em dash between two
-- clauses becomes a comma, which reads correctly in almost every case, and
-- nothing else about the text is touched.
--
-- The em dash is written as chr(8212) throughout rather than as the literal
-- character. This file has to survive the same repo-wide sweep it describes,
-- and a literal one here would have been rewritten into a comma, quietly
-- turning every match below into a match on ", ".
--
-- Safe to re-run: after the first pass there is nothing left to replace, and
-- the named rewrites only match their original wording.

-- ── 1. Contact stops sounding like a radio broadcast ─────────────────────
UPDATE public.site_sections
SET subtitle = 'Bookings & Press'
WHERE section_id = 'contact'
  AND subtitle IN ('Transmission', 'Transmission & Archive');

-- ── 2. Named rewrites, where restructuring beats a comma ─────────────────
UPDATE public.site_settings
SET value = 'Relatable lyricism over upbeat, captivating production. Stream the music, dig through the archive, and catch what lands next, all on Chey''s time.'
WHERE key = 'home.intro' AND value LIKE '%catch what comes next%';

UPDATE public.site_sections
SET description = 'Preview what is out now. The full record streams on the Album hour.'
WHERE section_id = 'digital' AND description LIKE '%Buy the record outright%';

UPDATE public.site_sections
SET empty_message = 'No dates on the calendar right now. New shows get announced here first, so check back soon.'
WHERE section_id = 'events' AND empty_message LIKE '%announced here first%';

UPDATE public.site_sections
SET empty_message = 'Coverage is still being gathered. For press enquiries, the line is open on X.'
WHERE section_id = 'press' AND empty_message LIKE '%Coverage is being gathered%';

UPDATE public.site_sections
SET image_alt = 'Portrait of Chey'
WHERE image_alt = 'Chey ' || chr(8212) || ' portrait';

UPDATE public.site_sections
SET image_alt = 'Chey, 2024 media kit cover'
WHERE image_alt = 'Chey ' || chr(8212) || ' 2024 media kit cover';

-- ── 3. General sweep over every user-visible text column ─────────────────
CREATE OR REPLACE FUNCTION pg_temp.dedash(t text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(
           regexp_replace(coalesce(t, ''), '[ \t]*' || chr(8212) || '[ \t]*', ', ', 'g'),
           ',[ \t]*,', ',', 'g')
$$;

CREATE OR REPLACE FUNCTION pg_temp.has_dash(t text) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$ SELECT position(chr(8212) in coalesce(t, '')) > 0 $$;

UPDATE public.site_settings SET
  value = pg_temp.dedash(value), label = pg_temp.dedash(label)
WHERE pg_temp.has_dash(value) OR pg_temp.has_dash(label);

UPDATE public.site_sections SET
  title = pg_temp.dedash(title),
  subtitle = pg_temp.dedash(subtitle),
  description = pg_temp.dedash(description),
  note = pg_temp.dedash(note),
  empty_message = pg_temp.dedash(empty_message),
  image_alt = pg_temp.dedash(image_alt),
  image_meta = pg_temp.dedash(image_meta)
WHERE pg_temp.has_dash(title) OR pg_temp.has_dash(subtitle)
   OR pg_temp.has_dash(description) OR pg_temp.has_dash(note)
   OR pg_temp.has_dash(empty_message) OR pg_temp.has_dash(image_alt)
   OR pg_temp.has_dash(image_meta);

UPDATE public.gallery_items SET
  alt = pg_temp.dedash(alt), meta = pg_temp.dedash(meta)
WHERE pg_temp.has_dash(alt) OR pg_temp.has_dash(meta);

UPDATE public.music_releases SET
  title = pg_temp.dedash(title), description = pg_temp.dedash(description)
WHERE pg_temp.has_dash(title) OR pg_temp.has_dash(description);

UPDATE public.merch_products SET
  title = pg_temp.dedash(title), meta = pg_temp.dedash(meta)
WHERE pg_temp.has_dash(title) OR pg_temp.has_dash(meta);

UPDATE public.music_products SET
  title = pg_temp.dedash(title), artist = pg_temp.dedash(artist),
  description = pg_temp.dedash(description)
WHERE pg_temp.has_dash(title) OR pg_temp.has_dash(artist)
   OR pg_temp.has_dash(description);

UPDATE public.events SET
  title = pg_temp.dedash(title), location = pg_temp.dedash(location),
  description = pg_temp.dedash(description)
WHERE pg_temp.has_dash(title) OR pg_temp.has_dash(location)
   OR pg_temp.has_dash(description);

UPDATE public.blog_posts SET
  title = pg_temp.dedash(title), excerpt = pg_temp.dedash(excerpt),
  body = pg_temp.dedash(body)
WHERE pg_temp.has_dash(title) OR pg_temp.has_dash(excerpt)
   OR pg_temp.has_dash(body);

UPDATE public.press_features SET
  outlet = pg_temp.dedash(outlet), headline = pg_temp.dedash(headline)
WHERE pg_temp.has_dash(outlet) OR pg_temp.has_dash(headline);

UPDATE public.about_credits SET
  role = pg_temp.dedash(role), name = pg_temp.dedash(name)
WHERE pg_temp.has_dash(role) OR pg_temp.has_dash(name);

UPDATE public.social_links SET label = pg_temp.dedash(label)
WHERE pg_temp.has_dash(label);

UPDATE public.upcoming_releases SET
  title = pg_temp.dedash(title), description = pg_temp.dedash(description),
  link_label = pg_temp.dedash(link_label)
WHERE pg_temp.has_dash(title) OR pg_temp.has_dash(description)
   OR pg_temp.has_dash(link_label);
