-- Orange Peel gets its video, and the two rows become one.
--
-- Confirmed by the client: https://youtu.be/JOhFEdk0i00 is Orange Peel.
--
-- Until now there were two rows for it, a titled, media-less "Orange Peel"
-- from the first seed, and an untitled row carrying the video, added when the
-- title was still unknown. This merges them: the video moves onto the named
-- row, and the placeholder is removed.
--
-- Only ever deletes a row that is untitled AND carries this exact video, so a
-- row someone has since named or edited is never touched.
--
-- The second video (SIcEPXmavDk) is deliberately left untitled, its name has
-- not been given, and this environment cannot resolve it. Name it in the
-- admin; the card renders correctly without one in the meantime.
--
-- Safe to re-run.

-- 1. Attach the video to the named row, but only if it has none.
UPDATE public.upcoming_releases
SET video_url = 'https://youtu.be/JOhFEdk0i00'
WHERE lower(trim(title)) = 'orange peel'
  AND coalesce(trim(video_url), '') = '';

-- 2. Drop the untitled placeholder, but only once the named row actually
--    carries the video, so a failure in step 1 can never lose it.
DELETE FROM public.upcoming_releases
WHERE coalesce(trim(title), '') = ''
  AND video_url ILIKE '%JOhFEdk0i00%'
  AND EXISTS (
    SELECT 1 FROM public.upcoming_releases keeper
    WHERE lower(trim(keeper.title)) = 'orange peel'
      AND keeper.video_url ILIKE '%JOhFEdk0i00%'
  );
