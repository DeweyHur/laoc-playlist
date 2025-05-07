import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
    try {
        // Check user profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('*')

        if (profilesError) {
            console.error('Error fetching user profiles:', profilesError)
            return
        }

        console.log('User Profiles:', JSON.stringify(profiles, null, 2))

        // Check auth users
        const { data: authUsers, error: authError } = await supabase
            .from('auth.users')
            .select('*')

        if (authError) {
            console.error('Error fetching auth users:', authError)
            return
        }

        console.log('Auth Users:', JSON.stringify(authUsers, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}

checkUsers() 