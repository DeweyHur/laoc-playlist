import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import {
  Button,
  Title3,
  Text,
  makeStyles,
  tokens,
  Spinner,
} from '@fluentui/react-components'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

const useStyles = makeStyles({
  loginContainer: {
    textAlign: 'center',
    padding: tokens.spacingHorizontalL,
    maxWidth: '400px',
    margin: '0 auto',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    color: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  kakaoIcon: {
    width: '24px',
    height: '24px',
    marginRight: tokens.spacingHorizontalS,
  },
})

function App() {
  const styles = useStyles()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleKakaoLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: 'http://localhost:5173/auth/callback',
          queryParams: {
            client_id: import.meta.env.VITE_KAKAO_CLIENT_ID,
            client_secret: import.meta.env.VITE_KAKAO_CLIENT_SECRET,
            scope: 'account_email profile_nickname'
          }
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error logging in with Kakao:', error.message)
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner label="Loading..." />
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.loginContainer}>
        <Title3>🎵 밴드방 유튜브 플레이리스트</Title3>
        <Text>로그인이 필요합니다</Text>
        <Button
          appearance="primary"
          className={styles.kakaoButton}
          onClick={handleKakaoLogin}
        >
          <img
            src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png"
            alt="KakaoTalk"
            className={styles.kakaoIcon}
          />
          카카오톡으로 로그인
        </Button>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<Layout user={user} onLogout={handleLogout} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage user={user} />} />
        <Route path="/playlist" element={<HomePage />} /> {/* For now, using HomePage as PlaylistPage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App