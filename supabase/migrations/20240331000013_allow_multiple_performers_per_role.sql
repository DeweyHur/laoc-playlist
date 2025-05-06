-- Drop any existing unique constraints
ALTER TABLE public.performance_video_roles
DROP CONSTRAINT IF EXISTS performance_video_roles_video_id_user_id_key;

ALTER TABLE public.performance_video_roles
DROP CONSTRAINT IF EXISTS performance_video_roles_video_id_role_user_id_key;

-- Add a unique constraint only on the combination of video_id, role, and user_id
-- This ensures a user can't have the same role multiple times for the same video
-- but can have multiple different roles for the same video
ALTER TABLE public.performance_video_roles
ADD CONSTRAINT performance_video_roles_video_id_role_user_id_key
UNIQUE (video_id, role, user_id); 