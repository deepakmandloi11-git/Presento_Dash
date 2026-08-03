import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In development: forward API calls to backend
      '/api': 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  define: {
    // Makes VITE_ env vars available in React code as import.meta.env.VITE_*
    // VITE_API_URL and VITE_WS_URL are only needed if hosting frontend
    // separately from backend. When served together (Railway), leave them blank.
  },
});
