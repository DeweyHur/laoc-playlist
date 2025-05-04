import { useState, useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { AuthProvider } from './contexts/AuthContext'
import { PlaylistProvider } from './contexts/PlaylistContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import HomePage from './pages/HomePage'
import PlaylistPage from './pages/PlaylistPage'
import ProfilePage from './pages/ProfilePage'
import AuthCallback from './pages/AuthCallback'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          element: <ProtectedRoute><HomePage /></ProtectedRoute>,
        },
        {
          path: 'playlist',
          element: <ProtectedRoute><HomePage /></ProtectedRoute>,
        },
        {
          path: 'playlist/:id',
          element: <ProtectedRoute><PlaylistPage /></ProtectedRoute>,
        },
        {
          path: 'profile',
          element: <ProtectedRoute><ProfilePage /></ProtectedRoute>,
        },
        {
          path: 'auth/callback',
          element: <AuthCallback />,
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FluentProvider theme={webLightTheme}>
        <ThemeProvider>
          <AuthProvider>
            <PlaylistProvider>
              <RouterProvider router={router} />
              <Toaster position="top-center" />
            </PlaylistProvider>
          </AuthProvider>
        </ThemeProvider>
      </FluentProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App