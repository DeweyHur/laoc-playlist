-- Drop existing foreign key if it exists
ALTER TABLE public.performance_video_roles
DROP CONSTRAINT IF EXISTS performance_video_roles_user_id_fkey;

-- Add foreign key to user_profiles
ALTER TABLE public.performance_video_roles
ADD CONSTRAINT performance_video_roles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.user_profiles(id)
ON DELETE CASCADE; 