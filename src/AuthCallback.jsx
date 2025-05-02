import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session) {
          // Update user profile with Kakao info if needed
          const { user } = session
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!profile && !profileError) {
            // Create user profile if it doesn't exist
            await supabase.from('users').insert({
              id: user.id,
              nickname: user.user_metadata?.nickname || 'Anonymous'
            })
          }
          
          navigate('/')
        }
      } catch (error) {
        console.error('Error in auth callback:', error.message)
        navigate('/')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="p-4 text-center">
      <p>로그인 처리 중...</p>
    </div>
  )
} 