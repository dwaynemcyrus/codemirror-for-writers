import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.js'),
      name: 'CodemirrorMarkdownHybrid',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
    },
    rollupOptions: {
      // Externalize peer dependencies
      external: [
        '@codemirror/commands',
        '@codemirror/lang-markdown',
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/language',
        '@codemirror/lang-javascript',
        '@codemirror/lang-python',
        '@codemirror/lang-css',
        '@codemirror/lang-html',
        '@codemirror/lang-json',
        '@lezer/highlight',
        'katex',
        'markdown-it',
        'markdown-it-emoji',
      ],
      output: {
        // Provide global variables for UMD build
        globals: {
          '@codemirror/commands': 'CodeMirrorCommands',
          '@codemirror/lang-markdown': 'CodeMirrorLangMarkdown',
          '@codemirror/state': 'CodeMirrorState',
          '@codemirror/view': 'CodeMirrorView',
        },
      },
    },
    outDir: 'dist',
    sourcemap: true,
  },
});
