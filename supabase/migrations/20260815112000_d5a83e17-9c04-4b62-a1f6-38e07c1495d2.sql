-- Upcoming (I): a video option, alongside the poster.
--
-- The hour could only ever show a still. A single announced with a visualiser
-- or a teaser had nowhere to put it, so the video went to Music (IV) — a
-- catalogue hour — and the announcement lost the thing people actually click.
--
-- `video_url` takes any YouTube form the rest of the site accepts (watch,
-- youtu.be, shorts, embed). When it is set the card plays the video; when it
-- is blank the card falls back to `artwork_url`; with neither it is still a
-- valid announcement, just text.
--
-- Safe to re-run.

ALTER TABLE public.upcoming_releases
  ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.upcoming_releases.video_url IS
  'YouTube link. Takes priority over artwork_url when both are set.';
