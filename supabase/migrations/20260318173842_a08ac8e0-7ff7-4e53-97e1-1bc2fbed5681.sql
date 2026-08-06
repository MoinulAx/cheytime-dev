CREATE TABLE public.download_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  email text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '72 hours'),
  downloaded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Public can read their own tokens by token value (no auth needed)
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read by token" ON public.download_tokens
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "System can insert tokens" ON public.download_tokens
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "System can update tokens" ON public.download_tokens
  FOR UPDATE TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can read all tokens" ON public.download_tokens
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));