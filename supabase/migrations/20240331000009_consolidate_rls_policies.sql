-- Fix locations policies
DROP POLICY IF EXISTS "Anyone can view locations" ON public.locations;
DROP POLICY IF EXISTS "Only admins can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Only admins can update locations" ON public.locations;
DROP POLICY IF EXISTS "Only admins can delete locations" ON public.locations;

CREATE POLICY "Anyone can view locations"
    ON public.locations FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert locations"
    ON public.locations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update locations"
    ON public.locations FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete locations"
    ON public.locations FOR DELETE
    USING (is_admin(auth.uid()));

GRANT SELECT ON public.locations TO anon, authenticated;
GRANT INSERT, UPDATE ON public.locations TO authenticated;
GRANT DELETE ON public.locations TO authenticated;

-- Fix regular performances policies
DROP POLICY IF EXISTS "Anyone can view regular performances" ON public.regular_performances;
DROP POLICY IF EXISTS "Only admins can insert regular performances" ON public.regular_performances;
DROP POLICY IF EXISTS "Only admins can update regular performances" ON public.regular_performances;
DROP POLICY IF EXISTS "Only admins can delete regular performances" ON public.regular_performances;

CREATE POLICY "Anyone can view regular performances"
    ON public.regular_performances FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert regular performances"
    ON public.regular_performances FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update regular performances"
    ON public.regular_performances FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete regular performances"
    ON public.regular_performances FOR DELETE
    USING (is_admin(auth.uid()));

GRANT SELECT ON public.regular_performances TO anon, authenticated;
GRANT INSERT, UPDATE ON public.regular_performances TO authenticated;
GRANT DELETE ON public.regular_performances TO authenticated;

-- Fix performance participants policies
DROP POLICY IF EXISTS "Anyone can view performance participants" ON public.performance_participants;
DROP POLICY IF EXISTS "Only admins can insert performance participants" ON public.performance_participants;
DROP POLICY IF EXISTS "Only admins can update performance participants" ON public.performance_participants;
DROP POLICY IF EXISTS "Only admins can delete performance participants" ON public.performance_participants;

CREATE POLICY "Anyone can view performance participants"
    ON public.performance_participants FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert performance participants"
    ON public.performance_participants FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update performance participants"
    ON public.performance_participants FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can delete performance participants"
    ON public.performance_participants FOR DELETE
    USING (is_admin(auth.uid()));

GRANT SELECT ON public.performance_participants TO anon, authenticated;
GRANT INSERT, UPDATE ON public.performance_participants TO authenticated;
GRANT DELETE ON public.performance_participants TO authenticated; 