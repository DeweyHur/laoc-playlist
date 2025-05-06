-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view performance videos" ON public.performance_videos;
DROP POLICY IF EXISTS "Only admins can manage performance videos" ON public.performance_videos;

-- Create new policies
CREATE POLICY "Anyone can view performance videos"
    ON public.performance_videos FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert performance videos"
    ON public.performance_videos FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update performance videos"
    ON public.performance_videos FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete performance videos"
    ON public.performance_videos FOR DELETE
    USING (is_admin(auth.uid()));

-- Grant necessary permissions
GRANT SELECT ON public.performance_videos TO anon, authenticated;
GRANT INSERT, UPDATE ON public.performance_videos TO authenticated;
GRANT DELETE ON public.performance_videos TO authenticated; 