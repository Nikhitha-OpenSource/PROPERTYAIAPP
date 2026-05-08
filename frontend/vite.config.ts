import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
  const backendWsUrl = backendUrl.replace(/^http/, 'ws')

  return {
    plugins: [react()],
    envDir: '..',
    server: {
      port: 5173,
      proxy: {
        '/api/v1/chat/ws': { target: backendWsUrl, ws: true },
        '/api': { target: backendUrl, changeOrigin: true },
        '/ws':  { target: backendWsUrl, ws: true },
      },
    },
    build: { outDir: 'dist', sourcemap: false },
  }
})
