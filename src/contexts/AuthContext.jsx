import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const isDevelopment = import.meta.env.DEV

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleKakaoLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'account_email profile_nickname'
        }
      })
      if (error) throw error

      // Create user profile if it doesn't exist
      if (data?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (!profile && !profileError) {
          // Create new user profile
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                nickname: data.user.user_metadata?.nickname || 'Anonymous',
                instruments: []
              }
            ])

          if (insertError) throw insertError
        }
      }
    } catch (error) {
      console.error('Error logging in with Kakao:', error.message)
      setError(error.message)
    }
  }

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in:', error.message)
      setError(error.message)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      alert('회원으로 가입되었습니다!')
    } catch (error) {
      console.error('Error signing up:', error.message)
      setError(error.message)
    }
  }

  const handleAnonymousSignIn = async () => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
    } catch (error) {
      console.error('Error signing in anonymously:', error.message)
      setError(error.message)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error logging out:', error.message)
    }
  }

  const value = {
    user,
    loading,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isDevelopment,
    handleKakaoLogin,
    handleEmailSignIn,
    handleSignUp,
    handleAnonymousSignIn,
    handleLogout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 