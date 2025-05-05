-- Add playlist_id column to regular_performances table
ALTER TABLE public.regular_performances
ADD COLUMN playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL;

-- Add RLS policy for playlist access
CREATE POLICY "Users can view regular performances with playlists"
  ON public.regular_performances FOR SELECT
  USING (true);

-- Add RLS policy for admin access to update playlist_id
CREATE POLICY "Admins can update regular performance playlist"
  ON public.regular_performances FOR UPDATE
  USING (is_admin(auth.uid())); 