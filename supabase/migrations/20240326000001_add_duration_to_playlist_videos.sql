-- Add duration column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'playlist_videos' 
    AND column_name = 'duration'
  ) THEN
    ALTER TABLE public.playlist_videos ADD COLUMN duration TEXT;
  END IF;
END $$; 