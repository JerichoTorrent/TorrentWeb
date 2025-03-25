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
  },
  server: {
    allowedHosts: ['deadcitystudios.com'],
  },
  assetsInclude: ['**/*.markdown'],
});
