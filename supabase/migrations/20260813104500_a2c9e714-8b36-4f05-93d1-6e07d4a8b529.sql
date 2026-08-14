-- Per-section control over how a hero photograph is cropped.
--
-- Every panel image is drawn into a fixed 16:9 frame with `object-fit: cover`,
-- anchored at dead centre. That is right for a photo whose subject is centred
-- and wrong for every other one: a portrait crop, or a shot with the subject
-- to one side, gets its subject pushed out of frame and reads as "the image is
-- off to the left". Until now the only fix was replacing the photograph.
--
-- `SectionImage.position` already existed in the type and was already applied
-- by the renderer, nothing ever populated it. This is the column that does.
--
-- Safe to re-run.

ALTER TABLE public.site_sections
  ADD COLUMN IF NOT EXISTS image_position text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.site_sections.image_position IS
  'CSS object-position for the panel image, e.g. "50% 20%" or "left center". Blank centres it.';
