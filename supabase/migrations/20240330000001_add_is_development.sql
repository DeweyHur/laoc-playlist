-- Add is_development column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN is_development BOOLEAN DEFAULT false;

-- Update existing admin users to also be development users
UPDATE user_profiles
SET is_development = true
WHERE role = 'admin';

-- Drop and recreate the users view to include the is_development field
DROP VIEW IF EXISTS users;
CREATE VIEW users AS
SELECT 
    auth.users.id,
    auth.users.email,
    user_profiles.nickname,
    user_profiles.role,
    user_profiles.is_development,
    user_profiles.created_at,
    user_profiles.updated_at
FROM auth.users
LEFT JOIN user_profiles ON auth.users.id = user_profiles.id; 