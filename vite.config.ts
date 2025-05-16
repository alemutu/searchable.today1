import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // Proxy requests to Supabase Edge Functions
      '/api/functions': {
        target: process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/functions/, '/functions/v1')
      }
    }
  }
});