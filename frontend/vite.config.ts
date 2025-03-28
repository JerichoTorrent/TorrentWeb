import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import history from 'connect-history-api-fallback';

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use(
          history({
            disableDotRule: true,
            htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
          })
        );
      },
    },
  ],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // ⚠️ increase limit from 500KB to 1000KB
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],             // separate core React
          router: ['react-router-dom'],              // separate React Router
        },
      },
    },
  },
  server: {
    allowedHosts: ['deadcitystudios.com'],
  },
  assetsInclude: ['**/*.markdown'],
});
