-- Remove the stock black-and-white imagery.
--
-- editorial-1/2/3.jpg were carried over from the legacy repo with everything
-- else, but they are not Chey — generic monochrome stock ("a woman in a long
-- dark coat", "ringed hands"). The four chey-*.jpg files are genuine
-- photographs of her and stay.
--
-- Rather than reuse those four across every panel, the sections that were
-- using a stock image now have no panel photograph at all. The renderer
-- already treats the image as optional, and an honest gap beats the same
-- portrait appearing three times.
--
-- Safe to re-run.

DELETE FROM public.gallery_items
WHERE image_url LIKE '/assets/editorial-%';

UPDATE public.site_sections
SET image_url = '', image_alt = '', image_meta = ''
WHERE image_url LIKE '/assets/editorial-%';

-- Gallery's own header photograph duplicated the one on Music. The section is
-- a wall of photographs; it does not need another above them.
UPDATE public.site_sections
SET image_url = '', image_alt = '', image_meta = ''
WHERE section_id = 'gallery';
