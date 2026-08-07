-- Restore the client's own content.
--
-- Three problems, all content rather than schema:
--
-- 1. The About biography in site_settings is not Chey's. It was carried over
--    from MIGRATION_REPORT.md §3, which recorded invented copy as "legacy
--    copy". Her real biography is on the legacy /about and / pages.
-- 2. music_links is seeded with placeholder titles (Video I–IV). Since the
--    site now prefers live rows over its static fallback, applying the last
--    migration actively replaced the real track names with those placeholders.
-- 3. The nine seeded gallery_items rows have no image_url, so every one is
--    filtered out and the archive falls back. Meanwhile seven real photographs
--    sat unused in the legacy repo.
--
-- Safe to re-run.

-- ── 1. Chey's real biography and quote ─────────────────────────────────────
-- UPDATE, not INSERT: the previous migration already seeded these keys, and
-- ON CONFLICT DO NOTHING would leave the wrong copy in place.
UPDATE public.site_settings SET value =
'Cheyenne, professionally known as “Chey”, is a multifaceted rap artist and musician originally from Staten Island, NY. Her deep-rooted passion for music led her to pursue a career in the industry after initially working in the field of psychology, specifically with children with special needs. Transitioning from her previous profession, Chey fully committed herself to her music and acting aspirations, drawing inspiration from her family''s strong musical background.

Chey''s introduction to rap music came from her father, who exposed her to the art of free-styling and rhymes. Having grown up in a musically inclined environment, she developed a love for both singing and performing from an early age. Her exposure to rap music, including iconic tracks like “Mama Said Knock You Out” by LL Cool J, played a pivotal role in shaping her artistic journey within the rap genre.

Chey''s musical style is a harmonious blend of relatable, upbeat, and lyrically captivating elements, aiming to resonate with a diverse audience. Her approach to her songs encompasses a wide range of themes, ensuring that her music reflects the experiences and emotions that people from different walks of life can relate to.

She hopes to convey messages of originality and self-confidence through her artistry, encouraging her listeners to embrace their individuality. She is motivated by the positive reactions and support she receives from her fans, which serve as a driving force in her artistic endeavors.

To aspiring artists seeking to establish themselves in the industry, Chey advocates for perseverance, self-authenticity, and steady dedication to their craft. She emphasizes the importance of staying true to one''s vision and maintaining a positive outlook, even in the face of challenges.

While staying true to her musical roots, she also envisions exploring opportunities in acting, allowing her to expand her creative horizons. Hip Hop''s Princess artistic journey is characterized by a steadfast commitment to her profession, an unwavering desire to connect with her audience, and an aspiration to make a meaningful impact through her music.'
WHERE key = 'about.bio';

UPDATE public.site_settings SET value = 'I don''t follow trends, I''m trending.'
WHERE key = 'about.quote';

-- ── 2. The home data strip ─────────────────────────────────────────────────
INSERT INTO public.site_settings (key, value, label, section_id, sort_order) VALUES
  ('home.fact.based',     'Staten Island, NY',        'Data strip — Based',     'home', 5),
  ('home.fact.genre',     'Hip-Hop',                  'Data strip — Genre',     'home', 6),
  ('home.fact.latest',    'Whips & Chains Freestyle', 'Data strip — Latest',    'home', 7),
  ('home.fact.direction', 'Borleone Films',           'Data strip — Direction', 'home', 8)
ON CONFLICT (key) DO NOTHING;

-- ── 3. Real track titles ───────────────────────────────────────────────────
-- Matched on youtube_id so this is correct no matter what the row is called.
UPDATE public.music_links SET title = 'Poppin'''             WHERE youtube_id = '29vWUXMTkME';
UPDATE public.music_links SET title = 'Long Kiss Goodnight'  WHERE youtube_id = 'OamCSPuswjg';
UPDATE public.music_links SET title = 'Session III'          WHERE youtube_id = '4T6mFd2Sz_Y';
UPDATE public.music_links SET title = 'Session IV'           WHERE youtube_id = 'l62mMBXck70';

-- NOTE: the 2026 press kit links three further videos —
--   SIcEPXmavDk, lXucfyLDE7M, xAkX2h97qeE
-- — and "Whips & Chains Freestyle" is named as the current single. Which id
-- belongs to which title is not recorded anywhere, so they are deliberately
-- not added: a guessed mapping would put the wrong name on a video. Add them
-- from the Music tab once the pairing is confirmed.

-- ── 4. Real photography into the archive ───────────────────────────────────
-- The nine existing rows are left alone — they carry captions the client
-- wrote, and are simply invisible until someone gives them an image. These are
-- new rows for the photographs that already exist in the repo.
INSERT INTO public.gallery_items (alt, meta, image_url, media_type, collection, sort_order)
SELECT v.alt, v.meta, v.image_url, 'image', 'archive', v.sort_order
FROM (VALUES
  ('Chey — portrait, braids and chain', 'Portrait', '/assets/chey-braids.jpg', 101),
  ('Chey — 2024 media kit cover',       'Media Kit · 2024', '/assets/chey-mediakit.jpg', 102),
  ('Chey — portrait with earring',      'Portrait', '/assets/chey-earring.jpg', 103),
  ('Chey — portrait, fur hat',          'Portrait', '/assets/chey-furhat.jpg', 104),
  ('Chey — editorial',                  'Editorial', '/assets/editorial-1.jpg', 105),
  ('Chey — editorial',                  'Editorial', '/assets/editorial-2.jpg', 106),
  ('Chey — editorial',                  'Editorial', '/assets/editorial-3.jpg', 107)
) AS v(alt, meta, image_url, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.gallery_items g WHERE g.image_url = v.image_url
);
