
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS on user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ═══════════════════════════════════════
-- contact_submissions
-- ═══════════════════════════════════════
CREATE TABLE public.contact_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE POLICY "Anyone can insert contact" ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read contacts" ON public.contact_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update contacts" ON public.contact_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete contacts" ON public.contact_submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- blog_posts
-- ═══════════════════════════════════════
CREATE TABLE public.blog_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    excerpt text NOT NULL,
    body text NOT NULL,
    date text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE POLICY "Public can read blog" ON public.blog_posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert blog" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update blog" ON public.blog_posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete blog" ON public.blog_posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- gallery_items
-- ═══════════════════════════════════════
CREATE TABLE public.gallery_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    alt text NOT NULL,
    meta text,
    image_url text DEFAULT '',
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE POLICY "Public can read gallery" ON public.gallery_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert gallery" ON public.gallery_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gallery" ON public.gallery_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gallery" ON public.gallery_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- music_links
-- ═══════════════════════════════════════
CREATE TABLE public.music_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    youtube_id text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE POLICY "Public can read music" ON public.music_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert music" ON public.music_links FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update music" ON public.music_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete music" ON public.music_links FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- merch_products
-- ═══════════════════════════════════════
CREATE TABLE public.merch_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    price numeric NOT NULL DEFAULT 0,
    meta text DEFAULT '',
    image_url text DEFAULT '',
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE POLICY "Public can read merch" ON public.merch_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert merch" ON public.merch_products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update merch" ON public.merch_products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete merch" ON public.merch_products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
