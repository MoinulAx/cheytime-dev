-- "Chey's Time", the mixtape, on the Album hour (III).
--
-- The record is released to Apple Music, so there is no file to upload and
-- nothing for the hour to stream. The row carries the streaming link instead
-- and the hour renders a Listen button beside the sleeve. See the loader
-- change in lib/loaders/album.ts.
--
-- What is here and what is not:
--
--   Title comes from the URL the client supplied
--   (music.apple.com/us/album/cheys-time/6804045277).
--
--   There is no tracklist, no artwork and no release date, because none of
--   that was supplied and Apple Music is unreachable from the build
--   environment, so it could not be read from the source. Inventing a
--   tracklist has put made-up content on this site once before. The sleeve
--   and the tracks can be added in the admin at any time, and the hour picks
--   them up with no further migration: upload the artwork on this row, and
--   add each track as its own row with this row's ID as "Parent album ID".
--
-- Idempotent: matched on the Apple Music link, so re-running updates the row
-- rather than adding a second copy, and an edit made in the admin to the
-- title or sleeve is left alone.

INSERT INTO public.music_releases (title, release_type, platform, platform_link, sort_order)
SELECT 'Chey''s Time', 'mixtape', 'apple_music',
       'https://music.apple.com/us/album/cheys-time/6804045277', 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.music_releases
  WHERE platform_link = 'https://music.apple.com/us/album/cheys-time/6804045277'
);

-- If the row already exists from an earlier run, make sure it is still typed
-- as a record. A row left as 'track' would drop off the Album hour.
UPDATE public.music_releases
SET release_type = 'mixtape'
WHERE platform_link = 'https://music.apple.com/us/album/cheys-time/6804045277'
  AND release_type NOT IN ('album', 'mixtape');
