import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 127.0.0.1 only: nginx is the sole way in, and binding 0.0.0.0 invites someone
    // to open :5173 directly — where the session cookie and CSRF behave differently
    // from production and the socket refuses to authenticate.
    host: '127.0.0.1',
    port: 5173,
    // Fail loudly instead of silently hopping to 5174, which nginx does not proxy.
    strictPort: true,
    hmr: {
      // The browser reaches Vite through nginx on 8080, so the HMR websocket must
      // be told to dial 8080 as well. Without this it tries 5173 directly, which
      // is not exposed — hot reload dies and the only symptom is a console error.
      clientPort: 8080,
    },
  },
  // No `server.proxy`. nginx owns proxying so dev and prod share one origin model;
  // adding a proxy here would give dev a second, divergent path to the backend.
});
