import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const isDevelopment = import.meta.env.VITE_IS_DEVELOPMENT === 'true'
  console.log('isDevelopment:', isDevelopment)

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const isAdmin = () => {
    return userProfile?.role === 'admin'
  }

  const canManagePerformances = () => {
    return isAdmin() || isDevelopment
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleKakaoLogin = async () => {
    try {
      console.log('Starting Kakao login process...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'account_email profile_nickname'
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error in Kakao login process:', error.message)
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
    userProfile,
    loading,
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    isDevelopment,
    handleKakaoLogin,
    handleEmailSignIn,
    handleSignUp,
    handleLogout,
    refreshUserProfile,
    isAdmin,
    canManagePerformances
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 