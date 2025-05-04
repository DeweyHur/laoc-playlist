import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import HomePage from './pages/HomePage'
import PlaylistPage from './pages/PlaylistPage'
import Layout from './components/Layout'
import ProfilePage from './pages/ProfilePage'
import { AuthProvider } from './contexts/AuthContext'
import { PlaylistProvider } from './contexts/PlaylistContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <AuthProvider>
        <PlaylistProvider>
          <Router>
            <Routes>
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
        </PlaylistProvider>
      </AuthProvider>
    </FluentProvider>
  )
}

export default App