-- Create a view for basic user information
CREATE OR REPLACE VIEW public.user_profiles_with_email AS
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email) as display_name
FROM auth.users;

-- Grant access to the view
GRANT SELECT ON public.user_profiles_with_email TO anon, authenticated; 