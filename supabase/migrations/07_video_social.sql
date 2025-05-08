-- Create video likes table
CREATE TABLE IF NOT EXISTS public.video_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.performance_videos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- Enable RLS for video likes
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for video likes
CREATE POLICY "Users can view all video likes" ON public.video_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own video likes" ON public.video_likes
    FOR ALL USING (auth.uid() = user_id);

-- Create video comments table
CREATE TABLE IF NOT EXISTS public.video_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.performance_videos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for video comments
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for video comments
CREATE POLICY "Users can view all video comments" ON public.video_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create video comments" ON public.video_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video comments" ON public.video_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video comments" ON public.video_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER handle_updated_at_video_comments
    BEFORE UPDATE ON public.video_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 