import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Spinner } from '@fluentui/react-components'

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession()
        if (error) throw error
        navigate('/', { replace: true })
      } catch (error) {
        console.error('Error handling auth callback:', error.message)
        navigate('/', { replace: true })
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spinner label="Completing sign in..." />
    </div>
  )
}

export default AuthCallback 