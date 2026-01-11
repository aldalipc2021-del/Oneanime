-- Add unique constraint for episode_progress upsert operations
ALTER TABLE public.episode_progress
ADD CONSTRAINT episode_progress_unique_user_anime_season_episode 
UNIQUE (user_id, anime_id, season_id, episode_number);