-- Two settings the site reads but nothing ever created.
--
-- `applyMusicChannel` looks up `music.channelLabel` and `music.channelUrl` for
-- the "Subscribe on @handle" link on the Music hour. Neither key was ever
-- seeded, so the lookup always missed and the site fell back to the handle
-- compiled into `lib/sections.static.ts`.
--
-- That is worse than it sounds. The Copy tab has create disabled on purpose,
-- because the keys are a fixed vocabulary the code looks up rather than a free
-- list. A key that is read but does not exist is therefore not editable by
-- anyone: the client cannot add it, and changing it means a deploy.
--
-- Values match the current fallback, so this changes nothing on screen. It
-- only makes the handle editable.
--
-- Safe to re-run.

INSERT INTO public.site_settings (key, value, label, section_id, sort_order)
VALUES
  ('music.channelLabel', '@CheyMusic127', 'YouTube handle', 'music', 1),
  ('music.channelUrl', 'https://www.youtube.com/@CheyMusic127', 'YouTube channel URL', 'music', 2)
ON CONFLICT (key) DO NOTHING;
