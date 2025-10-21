

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Inject VITE_BACKEND_URL into the global scope for use in service worker
    // Note: process.env is used here because the existing code uses it.
    '__BACKEND_API_BASE_URL__': JSON.stringify(process.env.VITE_BACKEND_URL || 'http://localhost:8000'),
  },
})