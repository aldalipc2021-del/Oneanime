
-- Series table
CREATE TABLE IF NOT EXISTS public.series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_en text,
  title_jp text,
  cover_image text,
  description text,
  genres text[] DEFAULT '{}',
  status text DEFAULT 'unknown',
  anilist_id integer UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seasons table
CREATE TABLE IF NOT EXISTS public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  season_number integer NOT NULL,
  anilist_id integer UNIQUE NOT NULL,
  title text,
  episode_count integer,
  aired_from date,
  aired_to date,
  cover_image text,
  trailer_url text,
  status text DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Episodes table
CREATE TABLE IF NOT EXISTS public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  episode_number integer NOT NULL,
  title text,
  title_jp text,
  synopsis text,
  air_date date,
  duration_minutes integer,
  thumbnail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, episode_number)
);

-- User progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  episodes_watched integer DEFAULT 0,
  status text DEFAULT 'plan_to_watch',
  rating numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, season_id)
);

-- Enable RLS
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Series: public read, service_role write
CREATE POLICY "Anyone can view series" ON public.series FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage series" ON public.series FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seasons: public read, service_role write
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage seasons" ON public.seasons FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Episodes: public read, service_role write
CREATE POLICY "Anyone can view episodes" ON public.episodes FOR SELECT TO public USING (true);
CREATE POLICY "Service role can manage episodes" ON public.episodes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User progress: users manage their own
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.user_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seasons_series_id ON public.seasons(series_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON public.episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_season_id ON public.user_progress(season_id);

-- Updated_at triggers
CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON public.seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
