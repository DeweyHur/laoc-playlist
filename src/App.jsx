import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import HomePage from './pages/HomePage'
import PlaylistPage from './pages/PlaylistPage'
import Layout from './components/Layout'
import ProfilePage from './pages/ProfilePage'
import { AuthProvider } from './contexts/AuthContext'
import { PlaylistProvider } from './contexts/PlaylistContext'
import { ChatProvider } from './contexts/ChatContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthCallback from './pages/AuthCallback'

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <AuthProvider>
        <PlaylistProvider>
          <ChatProvider>
            <Router>
              <Routes>
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/playlist" element={<PlaylistPage />} />
                  <Route path="/playlist/:id" element={<PlaylistPage />} />
                  <Route path="/playlist/:id/edit" element={<PlaylistPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Routes>
            </Router>
          </ChatProvider>
        </PlaylistProvider>
      </AuthProvider>
    </FluentProvider>
  )
}

export default App