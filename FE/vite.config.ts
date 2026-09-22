import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // su GitHub Pages il sito vive in /<nome-repo>/ (npm run build:pages)
  base: mode === 'pages' ? '/FS0226IT---U5W7D2/' : '/',
}))
