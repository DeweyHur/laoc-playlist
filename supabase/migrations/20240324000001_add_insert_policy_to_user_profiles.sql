-- Add insert policy for user_profiles table
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also add a policy for the trigger function to work
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER; 