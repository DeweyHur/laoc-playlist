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
        // Let Supabase handle the OAuth callback
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session) {
          // Create user profile if it doesn't exist
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!profile && !profileError) {
            // Create new user profile
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  nickname: session.user.user_metadata?.nickname || 'Anonymous',
                  instruments: []
                }
              ])

            if (insertError) throw insertError
          }

          navigate('/', { replace: true })
        } else {
          throw new Error('No session found')
        }
      } catch (error) {
        console.error('Error handling auth callback:', error.message)
        setError('Failed to complete sign in. Please try again.')
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