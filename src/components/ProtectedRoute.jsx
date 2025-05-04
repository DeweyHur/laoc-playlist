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
    minHeight: '100vh',
    gap: tokens.spacingVerticalM,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '300px',
  },
  buttonGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
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

  if (loading) {
    return (
      <div className={styles.container}>
        <Spinner label="Loading..." />
      </div>
    )
  }

  // Check if user exists but has no email (anonymous user)
  if (user && !user.email) {
    handleLogout()
    return <Navigate to="/" replace />
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <Text size={500}>로그인이 필요합니다</Text>
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
          <Button appearance="primary" onClick={handleKakaoLogin}>
            카카오로 로그인
          </Button>
        )}
      </div>
    )
  }

  return children
}

export default ProtectedRoute 