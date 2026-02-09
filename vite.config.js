import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  base: '/codemirror-for-writers/',
  build: {
    outDir: '../dist',
  },
  server: {
    port: 3000,
    open: true,
  },
});
