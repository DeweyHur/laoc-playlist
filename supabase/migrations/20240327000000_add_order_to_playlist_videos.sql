-- Add order column to playlist_videos table
ALTER TABLE public.playlist_videos ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Update existing rows to have sequential order based on created_at
WITH ordered_videos AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY playlist_id ORDER BY created_at) - 1 as new_order
  FROM public.playlist_videos
)
UPDATE public.playlist_videos
SET "order" = ordered_videos.new_order
FROM ordered_videos
WHERE playlist_videos.id = ordered_videos.id;

-- Make order column not null after setting initial values
ALTER TABLE public.playlist_videos ALTER COLUMN "order" SET NOT NULL;

-- Create index for faster ordering
CREATE INDEX IF NOT EXISTS idx_playlist_videos_order ON public.playlist_videos(playlist_id, "order"); 