import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  base: '/codemirror-for-writers/',
  build: {
    outDir: '../dist-demo',
  },
  server: {
    port: 4173,
    host: '127.0.0.1',
    open: false,
  },
});
