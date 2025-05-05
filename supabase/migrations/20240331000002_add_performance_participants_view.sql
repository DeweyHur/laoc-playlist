-- Create a view for performance participants with user information
CREATE OR REPLACE VIEW public.performance_participants_with_users AS
SELECT 
    pp.id,
    pp.performance_id,
    pp.user_id,
    u.email as user_email,
    pp.created_at
FROM public.performance_participants pp
JOIN auth.users u ON pp.user_id = u.id;

-- Grant access to the view
GRANT SELECT ON public.performance_participants_with_users TO anon, authenticated; 