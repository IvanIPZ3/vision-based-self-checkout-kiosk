import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const githubPagesBase = '/vision-based-self-checkout-kiosk/';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'pages' ? githubPagesBase : '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
}));
