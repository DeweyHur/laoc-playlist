-- Drop existing foreign key if it exists
ALTER TABLE public.performance_video_roles
DROP CONSTRAINT IF EXISTS performance_video_roles_user_id_fkey;

-- Add foreign key to user_profiles
ALTER TABLE public.performance_video_roles
ADD CONSTRAINT performance_video_roles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.user_profiles(id)
ON DELETE CASCADE;

-- Create a view for performance video roles with user information
CREATE OR REPLACE VIEW public.performance_video_roles_with_users AS
SELECT 
    pvr.*,
    up.email as user_email,
    up.nickname as user_display_name
FROM public.performance_video_roles pvr
JOIN public.user_profiles up ON pvr.user_id = up.id;

-- Grant access to the view
GRANT SELECT ON public.performance_video_roles_with_users TO authenticated;
GRANT SELECT ON public.performance_video_roles_with_users TO anon; 