import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import './index.css'
import App from './App.jsx'
import AuthCallback from './AuthCallback.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FluentProvider theme={webLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  </StrictMode>,
)
