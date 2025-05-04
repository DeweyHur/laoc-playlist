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
        // Get the hash fragment from the URL
        const hash = window.location.hash
        if (!hash) {
          throw new Error('No hash fragment found in URL')
        }

        // Parse the hash fragment
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const expiresIn = params.get('expires_in')

        if (!accessToken) {
          throw new Error('No access token found in URL')
        }

        // Set the session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError) throw sessionError

        // Get the session to verify it was set correctly
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession()
        if (getSessionError) throw getSessionError

        if (session) {
          navigate('/', { replace: true })
        } else {
          throw new Error('Failed to establish session')
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