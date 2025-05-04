-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can create their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON public.playlists;

DROP POLICY IF EXISTS "Users can view all playlist videos" ON public.playlist_videos;
DROP POLICY IF EXISTS "Users can insert their own playlist videos" ON public.playlist_videos;
DROP POLICY IF EXISTS "Users can update their own playlist videos" ON public.playlist_videos;
DROP POLICY IF EXISTS "Users can delete their own playlist videos" ON public.playlist_videos;

-- Recreate policies for playlists
CREATE POLICY "Users can view all playlists"
  ON public.playlists FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Recreate policies for playlist_videos
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