
-- Music products table for DSP/downloadable tracks
CREATE TABLE public.music_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  audio_url text DEFAULT '',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Purchases table for order tracking
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  item_type text NOT NULL DEFAULT 'merch',
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

-- RLS for music_products
CREATE POLICY "Public can read music products" ON public.music_products FOR SELECT USING (true);
CREATE POLICY "Admins can insert music products" ON public.music_products FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update music products" ON public.music_products FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete music products" ON public.music_products FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for purchases
CREATE POLICY "Admins can read purchases" ON public.purchases FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);

-- Storage bucket for music files (audio + covers)
INSERT INTO storage.buckets (id, name, public) VALUES ('music-files', 'music-files', true);

-- Storage policies
CREATE POLICY "Public can read music files" ON storage.objects FOR SELECT USING (bucket_id = 'music-files');
CREATE POLICY "Admins can upload music files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'music-files' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update music files" ON storage.objects FOR UPDATE USING (bucket_id = 'music-files' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete music files" ON storage.objects FOR DELETE USING (bucket_id = 'music-files' AND has_role(auth.uid(), 'admin'::app_role));
