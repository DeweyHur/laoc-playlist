-- Create playlist_videos table
CREATE TABLE IF NOT EXISTS public.playlist_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  title TEXT,
  channel_title TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all playlist videos"
  ON public.playlist_videos FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own playlist videos"
  ON public.playlist_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_videos.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own playlist videos"
  ON public.playlist_videos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_videos.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own playlist videos"
  ON public.playlist_videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_videos.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER on_playlist_video_updated
  BEFORE UPDATE ON public.playlist_videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 