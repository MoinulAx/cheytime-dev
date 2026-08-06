CREATE TABLE public.merch_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merch_product_id uuid NOT NULL REFERENCES public.merch_products(id) ON DELETE CASCADE,
  image_url text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.merch_product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read merch images" ON public.merch_product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert merch images" ON public.merch_product_images FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update merch images" ON public.merch_product_images FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete merch images" ON public.merch_product_images FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));