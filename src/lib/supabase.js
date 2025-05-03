import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
            getItem: (key) => {
                try {
                    return Promise.resolve(JSON.parse(window.localStorage.getItem(key)))
                } catch (error) {
                    return Promise.resolve(null)
                }
            },
            setItem: (key, value) => {
                window.localStorage.setItem(key, JSON.stringify(value))
                return Promise.resolve()
            },
            removeItem: (key) => {
                window.localStorage.removeItem(key)
                return Promise.resolve()
            },
        }
    }
}) 