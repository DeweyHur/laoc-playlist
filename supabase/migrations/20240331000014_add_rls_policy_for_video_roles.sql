-- Enable RLS on performance_video_roles table
ALTER TABLE performance_video_roles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to insert roles
CREATE POLICY "Allow admins to insert video roles"
ON performance_video_roles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Create policy to allow admins to view roles
CREATE POLICY "Allow admins to view video roles"
ON performance_video_roles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Create policy to allow admins to update roles
CREATE POLICY "Allow admins to update video roles"
ON performance_video_roles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

-- Create policy to allow admins to delete roles
CREATE POLICY "Allow admins to delete video roles"
ON performance_video_roles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
); 