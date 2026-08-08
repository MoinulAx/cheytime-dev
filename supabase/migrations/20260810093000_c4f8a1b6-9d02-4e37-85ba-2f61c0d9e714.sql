-- Give Journal, Events and Contact a hero photograph again.
--
-- These three lost theirs when the stock black-and-white imagery was deleted
-- (editorial-1/2/3.jpg). The rows still pointed at files that no longer
-- existed, so the panels rendered a broken image until the guard was
-- tightened, and have had no photograph since.
--
-- Rather than reuse one of the four local portraits two or three times over,
-- these are drawn from `gallery_items` — real photographs the client has
-- already uploaded, of which there are far more than four.
--
-- The choice is deliberately mechanical: the first images in gallery order
-- that are not already a section hero, one each, no duplicates. That is a
-- sensible default, not an editorial decision — whoever picks the *right*
-- photograph should do it in the admin's Sections tab, which now takes one
-- click per section.
--
-- Only fills a section whose image is currently blank, so it can be re-run and
-- will never overwrite a choice made in the admin.

WITH used AS (
  -- Photographs already serving as a hero somewhere, so no section repeats.
  SELECT image_url
  FROM public.site_sections
  WHERE coalesce(image_url, '') <> ''
),
candidates AS (
  SELECT
    g.image_url,
    g.alt,
    row_number() OVER (ORDER BY g.sort_order, g.created_at) AS rn
  FROM public.gallery_items g
  WHERE g.media_type = 'image'
    AND coalesce(g.image_url, '') <> ''
    AND g.image_url NOT IN (SELECT image_url FROM used)
),
assignment AS (
  SELECT *
  FROM (VALUES
    ('blog',    1, 'Journal · Dispatches'),
    ('events',  2, 'Live · Upcoming'),
    ('contact', 3, 'Open Line · 48hr Reply')
  ) AS a(section_id, rn, meta)
)
UPDATE public.site_sections s
SET image_url  = c.image_url,
    image_alt  = coalesce(nullif(c.alt, ''), 'Chey'),
    image_meta = a.meta,
    updated_at = now()
FROM assignment a
JOIN candidates c ON c.rn = a.rn
WHERE s.section_id = a.section_id
  AND coalesce(s.image_url, '') = '';

-- If gallery_items holds fewer than three unused photographs, the sections it
-- could not reach simply stay without one. The panel already treats the image
-- as optional, so that degrades to no banner rather than a broken one.
