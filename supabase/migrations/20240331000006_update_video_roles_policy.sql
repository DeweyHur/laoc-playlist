-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can insert video roles" ON performance_video_roles;
DROP POLICY IF EXISTS "Only admins can view video roles" ON performance_video_roles;
DROP POLICY IF EXISTS "Only admins can update video roles" ON performance_video_roles;
DROP POLICY IF EXISTS "Only admins can delete video roles" ON performance_video_roles;

-- Create new policies that allow both admins and development users
CREATE POLICY "Allow admins and development users to insert video roles"
ON performance_video_roles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_development = true)
    )
);

CREATE POLICY "Allow admins and development users to view video roles"
ON performance_video_roles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_development = true)
    )
);

CREATE POLICY "Allow admins and development users to update video roles"
ON performance_video_roles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_development = true)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_development = true)
    )
);

CREATE POLICY "Allow admins and development users to delete video roles"
ON performance_video_roles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND (user_profiles.role = 'admin' OR user_profiles.is_development = true)
    )
); 