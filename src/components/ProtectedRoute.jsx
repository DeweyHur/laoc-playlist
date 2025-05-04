import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Spinner, 
  Text, 
  Button, 
  Input,
  makeStyles, 
  tokens,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components'

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)', // Subtract header height
    padding: tokens.spacingHorizontalL,
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '300px',
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow8,
  },
  buttonGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  title: {
    marginBottom: tokens.spacingVerticalL,
    textAlign: 'center',
  }
})

function ProtectedRoute({ children }) {
  const styles = useStyles()
  const { 
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
  } = useAuth()

  console.log('ProtectedRoute - Auth State:', { user, loading, error })

  if (loading) {
    console.log('ProtectedRoute - Loading state')
    return (
      <div className={styles.container}>
        <Spinner label="Loading..." />
      </div>
    )
  }

  // Check if user exists but has no email (anonymous user)
  if (user && !user.email) {
    console.log('ProtectedRoute - Anonymous user detected')
    handleLogout()
    return <Navigate to="/" replace />
  }

  if (!user) {
    console.log('ProtectedRoute - No user, showing login form')
    return (
      <div className={styles.container}>
        <Text size={500} weight="semibold" className={styles.title}>로그인이 필요합니다</Text>
        {isDevelopment ? (
          <form className={styles.form} onSubmit={handleEmailSignIn}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className={styles.buttonGroup}>
              <Button appearance="primary" type="submit">
                로그인
              </Button>
              <Button appearance="secondary" onClick={handleSignUp}>
                회원가입
              </Button>
            </div>
          </form>
        ) : (
          <div className={styles.form}>
            <Button appearance="primary" onClick={handleKakaoLogin}>
              카카오로 로그인
            </Button>
          </div>
        )}
      </div>
    )
  }

  console.log('ProtectedRoute - User authenticated, rendering children')
  return children
}

export default ProtectedRoute 