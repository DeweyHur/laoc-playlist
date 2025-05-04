-- Create chat_read_timestamps table
CREATE TABLE IF NOT EXISTS chat_read_timestamps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE chat_read_timestamps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own read timestamps"
    ON chat_read_timestamps
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own read timestamps"
    ON chat_read_timestamps
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read timestamps"
    ON chat_read_timestamps
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON chat_read_timestamps
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at(); 