import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.io', '.ngrok.app', '.trycloudflare.com', '.loca.lt', 'localhost'],
    proxy: {
      '/api':  { target: 'http://localhost:3001', changeOrigin: true },
      '/view': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
