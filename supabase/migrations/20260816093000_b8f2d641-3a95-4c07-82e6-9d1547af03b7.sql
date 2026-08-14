-- The two client videos, on Upcoming (I).
--
-- They were added to Music (IV), the catalogue hour, which is where videos
-- normally live, but the ask is for them on the announcements hour. Music
-- keeps its copies; a video can legitimately be both a release and an
-- announcement, and removing them from IV would be deleting content nobody
-- asked to lose.
--
-- Titles are blank again, for the reason they were blank the first time:
-- youtube.com is unreachable from the build environment, so the names are not
-- known here, and a wrong name over a real song is worse than no name. A row
-- with a video and no title renders as the video plus its status, which is a
-- complete announcement card.
--
-- The existing "Orange Peel" row is left exactly as it is. If one of these
-- videos IS Orange Peel, paste its link onto that row in the admin and delete
-- the spare; that is a judgement only someone who can watch them can make.
--
-- Idempotent on video_url, matched loosely enough to catch either YouTube URL
-- form, so re-running adds nothing and a row already edited by hand is
-- untouched.

INSERT INTO public.upcoming_releases (title, status, video_url, sort_order, published)
SELECT '', 'announced', 'https://youtu.be/JOhFEdk0i00',
       coalesce((SELECT max(sort_order) FROM public.upcoming_releases), 0) + 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.upcoming_releases WHERE video_url ILIKE '%JOhFEdk0i00%'
);

INSERT INTO public.upcoming_releases (title, status, video_url, sort_order, published)
SELECT '', 'announced', 'https://youtu.be/SIcEPXmavDk',
       coalesce((SELECT max(sort_order) FROM public.upcoming_releases), 0) + 1, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.upcoming_releases WHERE video_url ILIKE '%SIcEPXmavDk%'
);
