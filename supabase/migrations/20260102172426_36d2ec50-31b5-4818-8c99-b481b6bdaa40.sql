-- Fix RLS policies for anime_comments - change from restrictive to permissive
DROP POLICY IF EXISTS "Anyone can view comments" ON public.anime_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.anime_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.anime_comments;

CREATE POLICY "Anyone can view comments" 
ON public.anime_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own comments" 
ON public.anime_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.anime_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix RLS policies for anime_ratings - change from restrictive to permissive
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.anime_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.anime_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.anime_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.anime_ratings;

CREATE POLICY "Anyone can view ratings" 
ON public.anime_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own ratings" 
ON public.anime_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.anime_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
ON public.anime_ratings 
FOR DELETE 
USING (auth.uid() = user_id);