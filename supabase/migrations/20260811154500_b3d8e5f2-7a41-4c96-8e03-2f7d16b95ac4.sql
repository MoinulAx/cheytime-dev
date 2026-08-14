-- Ordering, made editable.
--
-- Two kinds of order were still compiled into the bundle:
--
-- 1. Which hour of the dial a section sits on. `site_sections.sort_order`
--    existed and was editable but nothing read it, position came from a
--    hard-coded `hourIndex`, so moving Journal off hour I was a code change.
--    A real `hour_index` column now drives the dial.
--
-- 2. The order of rows inside a tab. Most content tables already had
--    `sort_order`; events, blog_posts and music_products did not, so those
--    three were stuck on their created_at.
--
-- Also moves Journal from hour I to hour V, freeing I.
--
-- Safe to re-run.

-- ── 1. Where each section sits on the dial ───────────────────────────────
ALTER TABLE public.site_sections
  ADD COLUMN IF NOT EXISTS hour_index integer;

COMMENT ON COLUMN public.site_sections.hour_index IS
  '0-11, where 0 is XII at the top. NULL keeps the built-in position. Home is pinned to 0 and ignores this.';

-- Seed the current layout so the column reflects what is actually on screen.
-- Only fills blanks: an hour someone has already set by hand is left alone.
UPDATE public.site_sections AS s
SET hour_index = v.hour_index
FROM (VALUES
  ('home',    0),
  ('blog',    5),   -- moved off I, which is now free
  ('about',   2),
  ('album',   3),
  ('music',   4),
  ('store',   6),
  ('digital', 7),
  ('events',  8),
  ('gallery', 9),
  ('contact', 10),
  ('press',   11)
) AS v(section_id, hour_index)
WHERE s.section_id = v.section_id
  AND s.hour_index IS NULL;

-- Journal specifically. Runs even if hour_index was already seeded by an
-- earlier run of this migration, but not if someone has since moved it
-- somewhere other than I, their choice wins over ours.
UPDATE public.site_sections
SET hour_index = 5
WHERE section_id = 'blog'
  AND hour_index = 1
  AND NOT EXISTS (
    SELECT 1 FROM public.site_sections other
    WHERE other.hour_index = 5 AND other.section_id <> 'blog'
  );

-- ── 2. Row order inside the three tabs that lacked it ────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.music_products
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Everything defaults to 0, which ties. The loaders break ties on the date
-- column each tab was already sorted by, so a table nobody has reordered
-- keeps exactly the order it has today.
