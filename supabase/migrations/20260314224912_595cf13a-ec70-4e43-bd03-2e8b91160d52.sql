
-- Add aspect_ratio to gallery_items
ALTER TABLE public.gallery_items ADD COLUMN IF NOT EXISTS aspect_ratio text DEFAULT 'landscape';

-- Create music_releases table for albums and tracks with platform-specific links
CREATE TABLE public.music_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  release_type text NOT NULL DEFAULT 'track', -- 'track' or 'album'
  platform text NOT NULL DEFAULT 'youtube', -- 'youtube', 'spotify', 'apple_music', 'itunes'
  platform_link text NOT NULL DEFAULT '',
  artwork_url text DEFAULT '',
  description text DEFAULT '',
  parent_album_id uuid REFERENCES public.music_releases(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.music_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read music releases" ON public.music_releases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert music releases" ON public.music_releases FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update music releases" ON public.music_releases FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete music releases" ON public.music_releases FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date_time timestamptz NOT NULL,
  location text NOT NULL DEFAULT '',
  description text DEFAULT '',
  ticket_link text DEFAULT '',
  image_url text DEFAULT '',
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published events" ON public.events FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins can read all events" ON public.events FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Create social_embeds table
CREATE TABLE public.social_embeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_type text NOT NULL DEFAULT 'instagram', -- 'instagram' or 'youtube'
  url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_embeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read social embeds" ON public.social_embeds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert social embeds" ON public.social_embeds FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update social embeds" ON public.social_embeds FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete social embeds" ON public.social_embeds FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Create outreach_logs table
CREATE TABLE public.outreach_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  topic text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'responded', 'published', 'declined'
  publication_link text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.outreach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read outreach" ON public.outreach_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert outreach" ON public.outreach_logs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update outreach" ON public.outreach_logs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete outreach" ON public.outreach_logs FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for general site uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for site-assets bucket
CREATE POLICY "Public can read site assets" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'site-assets');
CREATE POLICY "Admins can upload site assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets');
CREATE POLICY "Admins can update site assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-assets');
CREATE POLICY "Admins can delete site assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-assets');
