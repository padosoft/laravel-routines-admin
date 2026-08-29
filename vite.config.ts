import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Gli asset vivono sotto public/vendor/routines-admin nell'app ospite.
  base: '/vendor/routines-admin/',
  build: {
    outDir: 'public',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: { input: 'resources/js/admin/main.tsx' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['resources/js/admin/test/setup.ts'],
    globals: true,
  },
});
