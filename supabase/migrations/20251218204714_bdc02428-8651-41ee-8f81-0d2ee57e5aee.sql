-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  preferred_language TEXT DEFAULT 'de',
  country TEXT DEFAULT 'DE',
  push_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Create anime tracking table
CREATE TABLE public.anime_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anime_id INTEGER NOT NULL,
  anime_title TEXT NOT NULL,
  anime_image TEXT,
  current_episode INTEGER DEFAULT 0,
  total_episodes INTEGER,
  status TEXT DEFAULT 'watching' CHECK (status IN ('watching', 'completed', 'plan_to_watch')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, anime_id)
);

ALTER TABLE public.anime_tracking ENABLE ROW LEVEL SECURITY;

-- Anime tracking policies
CREATE POLICY "Users can view their own tracking"
ON public.anime_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking"
ON public.anime_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracking"
ON public.anime_tracking FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracking"
ON public.anime_tracking FOR DELETE
USING (auth.uid() = user_id);

-- Create episode notifications table
CREATE TABLE public.episode_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anime_id INTEGER NOT NULL,
  anime_title TEXT NOT NULL,
  episode_number INTEGER NOT NULL,
  release_date TIMESTAMP WITH TIME ZONE,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, anime_id, episode_number)
);

ALTER TABLE public.episode_notifications ENABLE ROW LEVEL SECURITY;

-- Episode notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.episode_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
ON public.episode_notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.episode_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.episode_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_anime_tracking_updated_at
  BEFORE UPDATE ON public.anime_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();