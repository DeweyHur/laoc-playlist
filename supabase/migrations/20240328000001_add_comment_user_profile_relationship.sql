-- Add foreign key relationship between comments and user_profiles
ALTER TABLE public.comments
ADD CONSTRAINT fk_comments_user_profiles
FOREIGN KEY (user_id)
REFERENCES public.user_profiles(id)
ON DELETE CASCADE; 