-- Create a view for basic user information
CREATE OR REPLACE VIEW public.user_profiles_with_email AS
SELECT 
    up.id,
    up.email,
    up.nickname
FROM auth.users u
JOIN public.user_profiles up ON u.id = up.id;

-- Grant access to the view
GRANT SELECT ON public.user_profiles_with_email TO anon, authenticated; 