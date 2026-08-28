ALTER TABLE public.series
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS episode_count integer,
  ADD COLUMN IF NOT EXISTS popularity integer,
  ADD COLUMN IF NOT EXISTS detail_synced_at timestamp with time zone;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS series_popularity_idx ON public.series (popularity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS series_title_trgm_idx ON public.series USING gin (title extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS series_title_en_trgm_idx ON public.series USING gin (title_en extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS series_title_jp_trgm_idx ON public.series USING gin (title_jp extensions.gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.sync_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL UNIQUE,
  last_page integer NOT NULL DEFAULT 0,
  total_items integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'idle',
  last_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sync_state TO anon;
GRANT SELECT ON public.sync_state TO authenticated;
GRANT ALL ON public.sync_state TO service_role;

ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sync state"
  ON public.sync_state FOR SELECT USING (true);

CREATE POLICY "Service role can manage sync state"
  ON public.sync_state FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_sync_state_updated_at
  BEFORE UPDATE ON public.sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();