-- Add nickname column to user_profiles table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'nickname'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN nickname TEXT DEFAULT 'Anonymous';
  END IF;
END $$;

-- Update handle_new_user function to include nickname
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, nickname)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      'Anonymous'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing records to use full_name as nickname if nickname is null
UPDATE public.user_profiles 
SET nickname = COALESCE(full_name, 'Anonymous')
WHERE nickname IS NULL; 