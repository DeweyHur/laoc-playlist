-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL DEFAULT 'Anonymous',
    instruments TEXT[] DEFAULT '{}',
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    channel TEXT DEFAULT 'global',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat read timestamps table
CREATE TABLE IF NOT EXISTS public.chat_read_timestamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_timestamps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user profiles
CREATE POLICY "Users can view all user profiles"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone can insert user profiles"
    ON public.user_profiles FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create RLS policies for messages
CREATE POLICY "Users can view all messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
    ON public.messages FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create RLS policies for chat read timestamps
CREATE POLICY "Users can view their own chat read timestamps"
    ON public.chat_read_timestamps FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat read timestamps"
    ON public.chat_read_timestamps FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat read timestamps"
    ON public.chat_read_timestamps FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.chat_read_timestamps
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 