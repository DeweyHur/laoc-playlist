-- Create messages table
CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "content" text NOT NULL,
    "user_id" uuid NOT NULL,
    "channel" text NOT NULL DEFAULT 'global',
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

-- Allow users to read all messages
CREATE POLICY "Enable read access for all users" ON "public"."messages"
    FOR SELECT USING (true);

-- Allow users to insert their own messages
CREATE POLICY "Users can insert their own messages" ON "public"."messages"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER "on_message_updated"
    BEFORE UPDATE ON "public"."messages"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_updated_at"(); 