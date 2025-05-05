-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own playlist videos" ON playlist_videos;

-- Create updated policy that explicitly allows order updates
CREATE POLICY "Users can update their own playlist videos" ON playlist_videos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM playlists
            WHERE playlists.id = playlist_videos.playlist_id
            AND playlists.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM playlists
            WHERE playlists.id = playlist_videos.playlist_id
            AND playlists.user_id = auth.uid()
        )
    );
