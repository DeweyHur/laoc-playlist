-- Drop the unique constraint if it exists
ALTER TABLE public.performance_video_roles
DROP CONSTRAINT IF EXISTS performance_video_roles_video_id_role_user_id_key;

-- Add a unique constraint only on the combination of video_id and user_id
-- This ensures a user can't have the same role multiple times for the same video
ALTER TABLE public.performance_video_roles
ADD CONSTRAINT performance_video_roles_video_id_user_id_key
UNIQUE (video_id, user_id); 