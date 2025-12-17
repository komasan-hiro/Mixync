import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': {
        target: 'http://210.131.211.133.nip.io',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://210.131.211.133.nip.io',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://210.131.211.133.nip.io',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})