-- The Album hour (III), and Digital (VII) becoming preview-only.
--
-- Hour III was one of two empty numerals on the dial. It now carries the
-- record: `music_releases.audio_url` — a column the admin could already write
-- to but nothing ever read — is streamed in full there.
--
-- Nothing is dropped and no row is overwritten if it already exists, so this
-- is safe to re-run and safe on a database an admin has already edited.

-- ── 1. The Album section's chrome ────────────────────────────────────────
-- Title, subtitle and supporting lines for hour III, so they are editable in
-- the admin like every other panel rather than compiled into the bundle.
INSERT INTO public.site_sections (
  section_id, title, subtitle, description, empty_message, sort_order
)
VALUES (
  'album',
  'Album',
  'The Record',
  '',
  'The record is being mastered. Full tracks land here when it drops.',
  3
)
ON CONFLICT (section_id) DO NOTHING;

-- ── 2. Digital is no longer a shop ───────────────────────────────────────
-- The Buy button is gone from hour VII; the hour plays preview clips only.
-- The `music_products` rows, their prices and their full-track files are all
-- left untouched — only the copy that told visitors they could buy changes.
UPDATE public.site_settings
SET value = 'Previews only. The full record streams on the Album hour.'
WHERE key = 'digital.note'
  AND value ILIKE '%purchase%';

UPDATE public.site_sections
SET note = 'Previews only. The full record streams on the Album hour.'
WHERE section_id = 'digital'
  AND (note ILIKE '%purchase%' OR note ILIKE '%buy%');

UPDATE public.site_sections
SET description = regexp_replace(
      description,
      '\s*(Buy|Purchase)[^.]*\.',
      '',
      'gi'
    )
WHERE section_id = 'digital'
  AND (description ILIKE '%purchase%' OR description ILIKE '%buy%');
