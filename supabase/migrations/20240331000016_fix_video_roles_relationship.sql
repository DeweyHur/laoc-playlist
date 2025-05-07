-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.performance_video_roles_with_users;

-- Create a new view that includes user profile information
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