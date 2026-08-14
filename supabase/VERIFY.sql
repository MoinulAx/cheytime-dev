-- Post-deploy verification. READ-ONLY, safe to paste into the Supabase SQL
-- editor. It changes nothing; it only reports.
--
-- Run this after `supabase db push` to confirm the schema landed and that
-- nothing is exposed. Written because the migration files alone cannot prove
-- either: two remote migrations (20260319201838, 20260326213428) were applied
-- without ever being committed, so a replay of `supabase/migrations/` is not a
-- complete picture of this database.

-- ── 1. Every table the site reads ────────────────────────────────────────
SELECT 'TABLES' AS check, n AS name,
       CASE WHEN to_regclass('public.'||n) IS NULL THEN '✗ MISSING' ELSE '✓' END AS status
FROM unnest(ARRAY[
  'site_settings','site_sections','music_releases','music_links','merch_products',
  'merch_product_images','music_products','gallery_items','press_features','blog_posts',
  'about_credits','social_links','events','contact_submissions','upcoming_releases',
  'purchases','outreach_logs','download_tokens','user_roles'
]) n
ORDER BY status DESC, name;

-- ── 2. Columns the newer features depend on ──────────────────────────────
SELECT 'COLUMNS' AS check, c AS name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema='public'
           AND table_name = split_part(c,'.',1)
           AND column_name = split_part(c,'.',2)
       ) THEN '✓' ELSE '✗ MISSING' END AS status
FROM unnest(ARRAY[
  'site_sections.hour_index',       -- dial position, editable in admin
  'site_sections.image_position',   -- hero framing
  'gallery_items.aspect_ratio',     -- masonry shape
  'events.sort_order',
  'blog_posts.sort_order',
  'music_products.sort_order',
  'music_releases.audio_url',       -- Album hour streams this
  'music_releases.parent_album_id',
  'upcoming_releases.release_date'
]) c
ORDER BY status DESC, name;

-- ── 3. The dial, as the database describes it ────────────────────────────
-- Expect twelve rows, hour_index 0-11 with no duplicates and no NULLs.
SELECT 'DIAL' AS check, section_id, hour_index, title
FROM public.site_sections
ORDER BY hour_index NULLS LAST;

SELECT 'DIAL DUPLICATES' AS check, hour_index, count(*) AS sections
FROM public.site_sections
GROUP BY hour_index HAVING count(*) > 1;

-- ── 4. Row Level Security ────────────────────────────────────────────────
-- Anything reported here as DISABLED is readable and writable by any visitor
-- holding the anon key, which is public. `user_roles` and `purchases` matter
-- most: the first decides who is an admin, the second holds order records.
SELECT 'RLS' AS check, tablename,
       CASE WHEN rowsecurity THEN '✓ enabled' ELSE '✗ DISABLED' END AS status,
       (SELECT count(*) FROM pg_policies p
        WHERE p.schemaname='public' AND p.tablename=t.tablename) AS policies
FROM pg_tables t
WHERE schemaname='public'
ORDER BY rowsecurity, tablename;

-- ── 5. Storage buckets ───────────────────────────────────────────────────
-- Both are expected to be public. Confirm nothing paid sits in music-files.
SELECT 'BUCKETS' AS check, id, public FROM storage.buckets ORDER BY id;

-- ── 6. Content the site will render as empty ─────────────────────────────
SELECT 'ROW COUNTS' AS check, 'upcoming_releases' AS t, count(*) FROM public.upcoming_releases
UNION ALL SELECT 'ROW COUNTS','gallery_items', count(*) FROM public.gallery_items
UNION ALL SELECT 'ROW COUNTS','music_releases', count(*) FROM public.music_releases
UNION ALL SELECT 'ROW COUNTS','music_releases with audio',
  count(*) FROM public.music_releases WHERE coalesce(audio_url,'') <> ''
UNION ALL SELECT 'ROW COUNTS','gallery_items missing aspect_ratio',
  count(*) FROM public.gallery_items WHERE coalesce(aspect_ratio,'') = ''
UNION ALL SELECT 'ROW COUNTS','events', count(*) FROM public.events
UNION ALL SELECT 'ROW COUNTS','blog_posts', count(*) FROM public.blog_posts;
