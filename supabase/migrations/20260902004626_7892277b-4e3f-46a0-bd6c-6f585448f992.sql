-- Table is empty; safe to change the column type
ALTER TABLE public.episode_progress
  DROP CONSTRAINT IF EXISTS episode_progress_user_id_anime_id_season_id_episode_number_key;
ALTER TABLE public.episode_progress
  DROP CONSTRAINT IF EXISTS episode_progress_unique_user_anime_season_episode;

ALTER TABLE public.episode_progress
  ALTER COLUMN season_id TYPE uuid USING NULL;

ALTER TABLE public.episode_progress
  ADD CONSTRAINT episode_progress_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE CASCADE;

ALTER TABLE public.episode_progress
  ADD CONSTRAINT episode_progress_unique_user_season_episode
  UNIQUE (user_id, season_id, episode_number);

CREATE INDEX IF NOT EXISTS episode_progress_user_anime_idx
  ON public.episode_progress (user_id, anime_id);