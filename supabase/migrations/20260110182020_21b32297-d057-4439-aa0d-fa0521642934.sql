-- Episode watch progress table
CREATE TABLE public.episode_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anime_id INTEGER NOT NULL,
  season_id INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  watched BOOLEAN NOT NULL DEFAULT false,
  watched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, anime_id, season_id, episode_number)
);

-- Enable RLS
ALTER TABLE public.episode_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progress"
ON public.episode_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.episode_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.episode_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
ON public.episode_progress FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_episode_progress_updated_at
BEFORE UPDATE ON public.episode_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Custom anime lists table
CREATE TABLE public.custom_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom lists
CREATE POLICY "Users can view their own lists"
ON public.custom_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public lists are viewable by everyone"
ON public.custom_lists FOR SELECT
USING (is_public = true);

CREATE POLICY "Users can insert their own lists"
ON public.custom_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
ON public.custom_lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
ON public.custom_lists FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_lists_updated_at
BEFORE UPDATE ON public.custom_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Custom list items table
CREATE TABLE public.custom_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.custom_lists(id) ON DELETE CASCADE,
  anime_id INTEGER NOT NULL,
  anime_title TEXT NOT NULL,
  anime_image TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(list_id, anime_id)
);

-- Enable RLS
ALTER TABLE public.custom_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for list items (based on list ownership)
CREATE POLICY "Users can view items in their own lists"
ON public.custom_list_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.custom_lists
    WHERE id = list_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view items in public lists"
ON public.custom_list_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.custom_lists
    WHERE id = list_id AND is_public = true
  )
);

CREATE POLICY "Users can insert items in their own lists"
ON public.custom_list_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_lists
    WHERE id = list_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update items in their own lists"
ON public.custom_list_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.custom_lists
    WHERE id = list_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items from their own lists"
ON public.custom_list_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.custom_lists
    WHERE id = list_id AND user_id = auth.uid()
  )
);

-- Premium subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add translate_descriptions preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS translate_descriptions BOOLEAN DEFAULT true;