-- Free downloads on the Digital hour (VII).
--
-- Until now every row in `music_products` was preview-only: the site played
-- `preview_audio_url` and `audio_url`, the full track, was deliberately never
-- sent to the browser. This adds one deliberate exception, a row the client
-- has marked as a free giveaway, whose full file the site links directly.
--
-- Why a flag and not `price = 0`:
--
--   `price` is NOT NULL DEFAULT 0, so every row created since the hour went
--   preview-only already has a price of zero. Treating zero as "free" would
--   have published the master audio for all of them the moment this deployed,
--   without anyone choosing it. An explicit column defaulting to false means
--   nothing becomes downloadable until someone ticks the box for that row.
--
-- `price` is left alone. It is still shown in the admin for reference and is
-- still what the legacy purchase flow reads.
--
-- Idempotent: safe to re-run, and safe to run against a database where the
-- column already exists.

ALTER TABLE public.music_products
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.music_products.is_free IS
  'When true, and the row is active and has a public audio_url, the Digital hour offers the full track as a free download. Defaults to false so no existing row is exposed by accident.';

-- Nothing is marked free by the migration itself. Which tracks to give away is
-- the client's decision, made per row in the admin, not ours to guess.
