-- Take the Music and Digital heroes off two undersized files.
--
-- /assets/chey-earring.jpg is 300x168 and /assets/chey-furhat.jpg is 403x494.
-- Both render as a panel banner around 800px wide, so the browser upscales
-- them two to three times. That is what "blurry" looks like, and no amount of
-- encoding quality fixes an upscale — the pixels are not there.
--
-- Same treatment as the other heroes: take a photograph from gallery_items
-- that is not already in use. The mechanical pick is a sane default, not an
-- editorial choice; the Sections tab is one click away.
--
-- The two files stay in the repo. They are fine at thumbnail size and the
-- Gallery may still reference them.
--
-- Only replaces a hero that is still pointing at one of those two files, so
-- this is safe to re-run and will not touch a choice made in the admin.

WITH used AS (
  SELECT image_url
  FROM public.site_sections
  WHERE coalesce(image_url, '') <> ''
    AND image_url NOT IN ('/assets/chey-earring.jpg', '/assets/chey-furhat.jpg')
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
    ('music',   1, 'Portrait · The Sound'),
    ('digital', 2, 'Digital · Downloads')
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
  AND s.image_url IN ('/assets/chey-earring.jpg', '/assets/chey-furhat.jpg');
