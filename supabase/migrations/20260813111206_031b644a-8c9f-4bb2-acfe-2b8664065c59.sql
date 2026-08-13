ALTER TABLE public.series
  ADD COLUMN IF NOT EXISTS tmdb_id integer,
  ADD COLUMN IF NOT EXISTS backdrop_image text,
  ADD COLUMN IF NOT EXISTS poster_image text,
  ADD COLUMN IF NOT EXISTS title_de text,
  ADD COLUMN IF NOT EXISTS description_de text;

ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS tmdb_id integer,
  ADD COLUMN IF NOT EXISTS backdrop_image text,
  ADD COLUMN IF NOT EXISTS title_de text,
  ADD COLUMN IF NOT EXISTS description_de text;

ALTER TABLE public.episodes
  ADD COLUMN IF NOT EXISTS title_de text,
  ADD COLUMN IF NOT EXISTS synopsis_de text;

CREATE TABLE IF NOT EXISTS public.streaming_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  country text NOT NULL,
  provider_name text NOT NULL,
  provider_id integer,
  logo_url text,
  offer_type text NOT NULL DEFAULT 'flatrate',
  link text,
  display_priority integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (series_id, country, provider_name, offer_type)
);

GRANT SELECT ON public.streaming_providers TO anon;
GRANT SELECT ON public.streaming_providers TO authenticated;
GRANT ALL ON public.streaming_providers TO service_role;

ALTER TABLE public.streaming_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view streaming providers"
  ON public.streaming_providers FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage streaming providers"
  ON public.streaming_providers FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_streaming_providers_updated_at
  BEFORE UPDATE ON public.streaming_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_streaming_providers_series_country
  ON public.streaming_providers (series_id, country);