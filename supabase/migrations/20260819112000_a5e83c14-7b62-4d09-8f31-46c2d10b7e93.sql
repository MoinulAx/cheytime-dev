-- Follow-up to the copy pass: the handful of places where turning an em dash
-- into a comma was not quite right.
--
-- The general sweep was deliberately blunt, so this cleans up after it. Three
-- kinds of case, all found by reading back what the sweep produced:
--
--   1. A comma splice. "unrepeatable, that's the whole point" joins two
--      independent clauses with a comma. It wants a full stop.
--   2. Captions that ended up with three commas in a row and stopped
--      scanning as a caption.
--   3. Admin labels where a colon reads better than a comma.
--
-- The biography needed nothing: it never contained an em dash, so the sweep
-- never touched it.
--
-- Every statement matches on the post-sweep text, so this is safe to re-run
-- and safe if a row has since been edited by hand.

-- ── 1. The comma splice in the Journal ───────────────────────────────────
UPDATE public.blog_posts
SET body = replace(
      body,
      'is unrepeatable, that''s the whole point.',
      'is unrepeatable. That''s the whole point.')
WHERE body LIKE '%is unrepeatable, that''s the whole point.%';

UPDATE public.blog_posts
SET excerpt = replace(
      excerpt,
      'is unrepeatable, that''s the whole point.',
      'is unrepeatable. That''s the whole point.')
WHERE excerpt LIKE '%is unrepeatable, that''s the whole point.%';

-- ── 2. Gallery captions ──────────────────────────────────────────────────
-- "Chey, portrait, braids and chain" reads as a list of three things rather
-- than a description of one photograph.
UPDATE public.gallery_items SET alt = 'Chey in braids and chain'
WHERE alt = 'Chey, portrait, braids and chain';

UPDATE public.gallery_items SET alt = 'Chey in a fur hat'
WHERE alt = 'Chey, portrait, fur hat';

UPDATE public.gallery_items SET alt = 'Chey wearing gold earrings'
WHERE alt = 'Chey, portrait with earring';

-- A colon separates a category from its subject better than a comma does.
UPDATE public.gallery_items SET alt = 'Music Video Shoot: Poppin'
WHERE alt = 'Music Video Shoot, Poppin';

UPDATE public.gallery_items SET alt = 'Live Performance: Raw Set'
WHERE alt = 'Live Performance, Raw Set';

UPDATE public.gallery_items SET alt = 'Music Video: Long Kiss Goodnight'
WHERE alt = 'Music Video, Long Kiss Goodnight';

-- ── 3. Admin labels ──────────────────────────────────────────────────────
-- Only ever seen in the admin, but the same rule applies.
UPDATE public.site_settings
SET label = replace(label, 'Data strip, ', 'Data strip: ')
WHERE label LIKE 'Data strip, %';
