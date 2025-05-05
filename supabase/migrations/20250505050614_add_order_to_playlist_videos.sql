-- Add order column to playlist_videos table
ALTER TABLE playlist_videos ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

-- Update existing rows to have sequential order within each playlist
WITH numbered_videos AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY playlist_id ORDER BY created_at) - 1 as new_order
  FROM playlist_videos
)
UPDATE playlist_videos
SET "order" = numbered_videos.new_order
FROM numbered_videos
WHERE playlist_videos.id = numbered_videos.id;
