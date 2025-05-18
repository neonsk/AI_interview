import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,      // CORS 設定（必要に応じて詳細設定も可能）
    allowedHosts: ['dev.re-interview.com'],
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
});
