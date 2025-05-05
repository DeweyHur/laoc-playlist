-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(name)
);

-- Create performance_participants table
CREATE TABLE IF NOT EXISTS public.performance_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    performance_id UUID REFERENCES public.regular_performances(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(performance_id, user_id)
);

-- Add location_id to regular_performances
ALTER TABLE public.regular_performances
ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for locations
CREATE POLICY "Anyone can view locations"
    ON public.locations FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert locations"
    ON public.locations FOR INSERT
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update locations"
    ON public.locations FOR UPDATE
    USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete locations"
    ON public.locations FOR DELETE
    USING (is_admin(auth.uid()));

-- Create policies for performance_participants
CREATE POLICY "Anyone can view performance participants"
    ON public.performance_participants FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage performance participants"
    ON public.performance_participants FOR ALL
    USING (is_admin(auth.uid()));

-- Create trigger for updated_at on locations
CREATE TRIGGER on_location_updated
    BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 