import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Ensure relative paths for assets in Capacitor
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'https://210.131.211.133.nip.io',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://210.131.211.133.nip.io',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://210.131.211.133.nip.io',
        changeOrigin: true,
        secure: false, // Important for self-signed certs with WSS
        ws: true,
      }
    }
  }
})