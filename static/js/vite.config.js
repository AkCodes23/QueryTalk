import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../build', // Output to Flask's static folder structure
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  server: {
    port: 5173, // Vite dev server port
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Flask server
        changeOrigin: true,
      }
    }
  }
})
