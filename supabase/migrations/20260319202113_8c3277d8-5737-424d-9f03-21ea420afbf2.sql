
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS external_url text DEFAULT '';
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS thumbnail_url text DEFAULT '';
ALTER TABLE public.music_products ADD COLUMN IF NOT EXISTS preview_audio_url text DEFAULT '';
ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image';
ALTER TABLE public.music_releases ADD COLUMN IF NOT EXISTS audio_url text DEFAULT '';
