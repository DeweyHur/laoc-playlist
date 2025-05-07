-- Create performance_videos table
CREATE TABLE IF NOT EXISTS public.performance_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    performance_id UUID REFERENCES public.regular_performances(id) ON DELETE CASCADE,
    youtube_url TEXT NOT NULL,
    title TEXT,
    channel_title TEXT,
    thumbnail_url TEXT,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create performance_video_roles table for role metadata
CREATE TABLE IF NOT EXISTS public.performance_video_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID REFERENCES public.performance_videos(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- e.g., 'Drum', 'Guitar', 'Vocal'
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(video_id, role, user_id)
);

-- Enable RLS
ALTER TABLE public.performance_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_video_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for performance_videos
CREATE POLICY "Anyone can view performance videos"
    ON public.performance_videos FOR SELECT
    USING (true);

CREATE POLICY "Only admins and development users can manage performance videos"
    ON public.performance_videos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND (user_profiles.role = 'admin' OR user_profiles.is_development = true)
        )
    );

-- Create policies for performance_video_roles
CREATE POLICY "Anyone can view performance video roles"
    ON public.performance_video_roles FOR SELECT
    USING (true);

CREATE POLICY "Only admins and development users can manage performance video roles"
    ON public.performance_video_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND (user_profiles.role = 'admin' OR user_profiles.is_development = true)
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER on_performance_video_updated
    BEFORE UPDATE ON public.performance_videos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 