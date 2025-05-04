import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
    try {
        // Create the user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: 'test@example.com',
            password: 'password123',
            email_confirm: true,
            user_metadata: { name: 'Test User' }
        })

        if (authError) throw authError

        console.log('User created:', authData)

        // Create the user profile
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .insert([
                {
                    id: authData.user.id,
                    email: 'test@example.com',
                    nickname: 'Test User'
                }
            ])
            .select()

        if (profileError) throw profileError

        console.log('Profile created:', profileData)
    } catch (error) {
        console.error('Error:', error.message)
    }
}

createTestUser() 