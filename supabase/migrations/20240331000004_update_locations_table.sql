-- Add new columns to locations table
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Create index on place_id
CREATE UNIQUE INDEX IF NOT EXISTS locations_place_id_idx ON public.locations(place_id); 