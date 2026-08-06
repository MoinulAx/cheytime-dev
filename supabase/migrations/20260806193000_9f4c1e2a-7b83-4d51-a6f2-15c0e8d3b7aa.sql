
-- Create press_features table for editorial coverage (BET, VIBE, iHeart, ...)
-- Seeded from the CHEY2026 press kit.
CREATE TABLE public.press_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet text NOT NULL,
  headline text NOT NULL,
  url text NOT NULL DEFAULT '',
  published_at date,
  sort_order integer DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.press_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published press" ON public.press_features FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins can read all press" ON public.press_features FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert press" ON public.press_features FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update press" ON public.press_features FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete press" ON public.press_features FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Seed: the four press hits linked from the 2026 kit. Headlines are derived
-- from each article's own slug and should be confirmed against the live pages.
INSERT INTO public.press_features (outlet, headline, url, published_at, sort_order) VALUES
  ('iHeartRadio', 'Way Up With Angela Yee: Chey Smith Tells Us A Secret', 'https://wjlbdetroit.iheart.com/featured/angela-yee/content/2024-05-31-1119-way-up-with-angela-yee-way-up-with-chey-smith-tell-us-a-secret/', '2024-05-31', 1),
  ('BET', 'Method Man''s Daughter Releases Her New Music', 'https://www.bet.com/article/t1pii7/method-mans-daughter-releases-her-new-music', NULL, 2),
  ('VIBE', 'Method Man''s Daughter Chey Performs With Trina In Detroit', 'https://www.vibe.com/music/music-news/method-man-daughter-chey-perform-trina-detroit-1234862254/', NULL, 3),
  ('YouTube', 'Interview', 'https://www.youtube.com/watch?v=buAynLjO8ok', NULL, 4)
ON CONFLICT DO NOTHING;
