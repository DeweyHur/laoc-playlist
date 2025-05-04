import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Spinner, MessageBar, MessageBarBody } from '@fluentui/react-components'

function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Starting callback handling...')
        console.log('Current URL:', window.location.href)
        
        // Let Supabase handle the OAuth callback
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('AuthCallback: Session check result:', { session, error })
        
        if (error) {
          console.error('AuthCallback: Error getting session:', error)
          throw error
        }
        
        if (!session) {
          console.error('AuthCallback: No session found')
          throw new Error('No session found')
        }

        console.log('AuthCallback: Session found, user:', session.user)
        
        // Create user profile if it doesn't exist
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('AuthCallback: Profile check result:', { profile, profileError })

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('AuthCallback: Error checking profile:', profileError)
          throw profileError
        }

        if (!profile) {
          console.log('AuthCallback: Creating new user profile...')
          // Create new user profile
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                nickname: session.user.user_metadata?.nickname || session.user.user_metadata?.full_name || 'Anonymous',
                instruments: []
              }
            ])

          console.log('AuthCallback: Profile creation result:', { insertError })
          if (insertError) throw insertError
        }

        navigate('/', { replace: true })
      } catch (error) {
        console.error('AuthCallback: Error in callback handling:', error.message)
        setError('Failed to complete sign in. Please try again: ' + error.message)
        // Still navigate to home after a delay to show the error
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
      {error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : (
        <Spinner label="Completing sign in..." />
      )}
    </div>
  )
}

export default AuthCallback 