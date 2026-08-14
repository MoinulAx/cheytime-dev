-- Both videos, named, on Upcoming (I).
--
-- Client-confirmed titles:
--   https://youtu.be/JOhFEdk0i00  →  Orange Peel
--   https://youtu.be/SIcEPXmavDk  →  Whips & Chains Freestyle
--
-- Written to be self-contained rather than to sit on top of the two previous
-- attempts. The live site currently shows "Orange Peel" with no video and no
-- second entry, which happens either because those migrations were not pushed
-- or because the deploy is running older code that skipped untitled rows. This
-- reaches the same end state from any of those starting points, and — because
-- both rows end up *titled* — it renders correctly even on the older code,
-- which is the version that could not display an untitled row.
--
-- End state: exactly one row per video, each with its real title, and no
-- untitled leftovers.
--
-- Safe to re-run.

-- The column, in case the migration that added it has not been applied.
ALTER TABLE public.upcoming_releases
  ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';

-- ── Orange Peel ──────────────────────────────────────────────────────────
-- 1. A row already carries this video: make sure it is named.
UPDATE public.upcoming_releases
SET title = 'Orange Peel'
WHERE video_url ILIKE '%JOhFEdk0i00%'
  AND coalesce(trim(title), '') = '';

-- 2. A row is already named: make sure it carries the video.
UPDATE public.upcoming_releases
SET video_url = 'https://youtu.be/JOhFEdk0i00'
WHERE lower(trim(title)) = 'orange peel'
  AND coalesce(trim(video_url), '') = '';

-- 3. Neither existed: create it.
INSERT INTO public.upcoming_releases (title, status, video_url, sort_order, published)
SELECT 'Orange Peel', 'announced', 'https://youtu.be/JOhFEdk0i00',
       coalesce((SELECT max(sort_order) FROM public.upcoming_releases), 0) + 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.upcoming_releases WHERE video_url ILIKE '%JOhFEdk0i00%'
);

-- ── Whips & Chains Freestyle ─────────────────────────────────────────────
UPDATE public.upcoming_releases
SET title = 'Whips & Chains Freestyle'
WHERE video_url ILIKE '%SIcEPXmavDk%'
  AND coalesce(trim(title), '') = '';

UPDATE public.upcoming_releases
SET video_url = 'https://youtu.be/SIcEPXmavDk'
WHERE lower(trim(title)) = 'whips & chains freestyle'
  AND coalesce(trim(video_url), '') = '';

INSERT INTO public.upcoming_releases (title, status, video_url, sort_order, published)
SELECT 'Whips & Chains Freestyle', 'announced', 'https://youtu.be/SIcEPXmavDk',
       coalesce((SELECT max(sort_order) FROM public.upcoming_releases), 0) + 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.upcoming_releases WHERE video_url ILIKE '%SIcEPXmavDk%'
);

-- ── Remove duplicates left by the earlier attempts ───────────────────────
-- Only ever drops a row that is a strict duplicate: same video, and another
-- row with a lower id already carries it. The named copy is always the one
-- that survives, and a row holding anything else is never touched.
DELETE FROM public.upcoming_releases dup
WHERE dup.video_url ILIKE ANY (ARRAY['%JOhFEdk0i00%', '%SIcEPXmavDk%'])
  AND EXISTS (
    SELECT 1 FROM public.upcoming_releases keep
    WHERE keep.id <> dup.id
      AND keep.video_url = dup.video_url
      AND coalesce(trim(keep.title), '') <> ''
      AND (coalesce(trim(dup.title), '') = '' OR keep.id < dup.id)
  );

-- Make sure both are visible and not sorted behind anything stale.
UPDATE public.upcoming_releases
SET published = true
WHERE video_url ILIKE ANY (ARRAY['%JOhFEdk0i00%', '%SIcEPXmavDk%'])
  AND published IS DISTINCT FROM true;
