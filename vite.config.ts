import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The full Supabase URL is defined here to be used in the proxy configuration.
const supabaseUrl = 'https://flqfhtnzifmguzttjvgv.supabase.co';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  server: {
    proxy: {
      // Proxy requests for Supabase services to the target URL.
      // This is necessary to bypass CORS issues in sandboxed/development environments.
      '/auth/v1': {
        target: supabaseUrl,
        changeOrigin: true,
      },
      '/rest/v1': {
        target: supabaseUrl,
        changeOrigin: true,
      },
      '/storage/v1': {
        target: supabaseUrl,
        changeOrigin: true,
      },
      '/realtime/v1': {
        target: supabaseUrl,
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying for real-time features.
      },
    }
  }
})
