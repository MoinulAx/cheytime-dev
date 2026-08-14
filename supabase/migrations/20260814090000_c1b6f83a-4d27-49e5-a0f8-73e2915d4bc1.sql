-- Two videos the client sent, and a slot for the SMG logo.
--
-- ── The videos ───────────────────────────────────────────────────────────
-- Added to Music (IV) with **blank titles**, deliberately.
--
-- Neither URL could be resolved from the build environment (youtube.com is
-- blocked at the egress proxy), so the titles are not known here. Writing a
-- guess is how `music_links` ended up with two invented track names and two
-- real ones attached to the wrong videos — see the traps in HANDOFF. A blank
-- title renders as the index number and the player, which claims nothing;
-- filling it in takes ten seconds in the Music & Album tab.
--
-- `title` is NOT NULL but '' is a legal value, so this is a real row, not a
-- half-written one.
--
-- Idempotent on `platform_link`: re-running will not duplicate them, and if
-- someone has already added either video by hand this skips it and leaves
-- their title alone.

INSERT INTO public.music_releases (title, release_type, platform, platform_link, sort_order)
SELECT '', 'track', 'youtube', 'https://youtu.be/JOhFEdk0i00',
       coalesce((SELECT max(sort_order) FROM public.music_releases), 0) + 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.music_releases WHERE platform_link ILIKE '%JOhFEdk0i00%'
);

INSERT INTO public.music_releases (title, release_type, platform, platform_link, sort_order)
SELECT '', 'track', 'youtube', 'https://youtu.be/SIcEPXmavDk',
       coalesce((SELECT max(sort_order) FROM public.music_releases), 0) + 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.music_releases WHERE platform_link ILIKE '%SIcEPXmavDk%'
);

-- ── The SMG logo ─────────────────────────────────────────────────────────
-- The image itself cannot be committed from here — it was shared in chat, not
-- as a file this environment can read. So this creates the slot rather than
-- the asset: upload the logo against `brand.logo_url` in the admin's Copy tab
-- and it appears in the footer. Blank renders nothing at all, so the site
-- never shows a broken image while the slot is empty.

INSERT INTO public.site_settings (key, value, label, section_id, sort_order)
VALUES
  ('brand.logo_url', '', 'SMG logo', 'home', 90),
  ('brand.logo_alt', 'Smoke Media Group', 'SMG logo alt text', 'home', 91),
  ('brand.logo_link', '', 'SMG logo link', 'home', 92)
ON CONFLICT (key) DO NOTHING;
