-- Create comments table for public anime comments
CREATE TABLE public.anime_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anime_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ratings table for OneAnime user ratings
CREATE TABLE public.anime_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anime_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5.0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(anime_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.anime_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anime_ratings ENABLE ROW LEVEL SECURITY;

-- Comments are publicly readable
CREATE POLICY "Anyone can view comments"
ON public.anime_comments
FOR SELECT
USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert their own comments"
ON public.anime_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.anime_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Ratings are publicly readable
CREATE POLICY "Anyone can view ratings"
ON public.anime_ratings
FOR SELECT
USING (true);

-- Users can insert their own ratings
CREATE POLICY "Users can insert their own ratings"
ON public.anime_ratings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
ON public.anime_ratings
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
ON public.anime_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at on comments
CREATE TRIGGER update_anime_comments_updated_at
BEFORE UPDATE ON public.anime_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on ratings
CREATE TRIGGER update_anime_ratings_updated_at
BEFORE UPDATE ON public.anime_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();