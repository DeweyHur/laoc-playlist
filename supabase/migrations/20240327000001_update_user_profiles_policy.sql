-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;

-- Create a new policy that allows viewing all profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT
    USING (true);

-- Keep other policies
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id); 