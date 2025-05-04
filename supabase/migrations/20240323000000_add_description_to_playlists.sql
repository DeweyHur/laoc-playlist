-- Add description column to playlists table
ALTER TABLE public.playlists
ADD COLUMN description TEXT;

-- Update existing rows to have empty description
UPDATE public.playlists
SET description = ''
WHERE description IS NULL; 