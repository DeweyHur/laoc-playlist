-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all playlist videos" ON public.playlist_videos;
DROP POLICY IF EXISTS "Users can insert their own playlist videos" ON public.playlist_videos;
DROP POLICY IF EXISTS "Users can update their own playlist videos" ON public.playlist_videos;
DROP POLICY IF EXISTS "Users can delete their own playlist videos" ON public.playlist_videos;

-- Recreate policies with proper conditions
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

-- Make sure RLS is enabled
ALTER TABLE public.playlist_videos ENABLE ROW LEVEL SECURITY; 