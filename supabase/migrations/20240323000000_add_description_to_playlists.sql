-- Add updated_at column first
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Add description column
ALTER TABLE public.playlists
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Update existing rows to have empty description
UPDATE public.playlists
SET description = COALESCE(description, ''); 