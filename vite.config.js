import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // This will fail if port 5173 is not available
  },
  build: {
    sourcemap: true, // Enable source maps for debugging
  },
})
