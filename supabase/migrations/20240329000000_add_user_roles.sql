-- Create enum type for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Add role column to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN role user_role NOT NULL DEFAULT 'user';

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set initial admin users
UPDATE public.user_profiles
SET role = 'admin'
WHERE email IN ('digitzetre@gmail.com', 'deweyhur@gmail.com');

-- Add RLS policies for admin access
CREATE POLICY "Admins can update any profile"
  ON public.user_profiles FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any profile"
  ON public.user_profiles FOR DELETE
  USING (is_admin(auth.uid()));

-- Add RLS policies for admin access to playlists
CREATE POLICY "Admins can update any playlist"
  ON public.playlists FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any playlist"
  ON public.playlists FOR DELETE
  USING (is_admin(auth.uid()));

-- Add RLS policies for admin access to playlist videos
CREATE POLICY "Admins can update any playlist video"
  ON public.playlist_videos FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete any playlist video"
  ON public.playlist_videos FOR DELETE
  USING (is_admin(auth.uid())); 