-- Create regular_performances table
CREATE TABLE IF NOT EXISTS public.regular_performances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  location TEXT,
  youtube_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.regular_performances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view regular performances"
  ON public.regular_performances FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert regular performances"
  ON public.regular_performances FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only admins can update regular performances"
  ON public.regular_performances FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can delete regular performances"
  ON public.regular_performances FOR DELETE
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER on_regular_performance_updated
  BEFORE UPDATE ON public.regular_performances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at(); 