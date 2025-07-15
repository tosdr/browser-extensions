import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/shared': resolve(__dirname, 'src/shared'),
      '@/background': resolve(__dirname, 'src/background'),
      '@/popup': resolve(__dirname, 'src/popup'),
      '@/content': resolve(__dirname, 'src/content'),
      '@/options': resolve(__dirname, 'src/options')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env['NODE_ENV'] === 'development',
    minify: process.env['NODE_ENV'] === 'production',
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/scripts/background.ts'),
        popup: resolve(__dirname, 'src/scripts/views/popup.ts'),
        settings: resolve(__dirname, 'src/scripts/views/settings.ts'),
        'popup-html': resolve(__dirname, 'src/views/popup.html'),
        'settings-html': resolve(__dirname, 'src/views/settings/settings.html')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          if (name === 'background') {
            return 'scripts/background.js';
          }
          if (name === 'popup') {
            return 'scripts/views/popup.js';
          }
          if (name === 'settings') {
            return 'scripts/views/settings.js';
          }
          return 'scripts/[name].js';
        },
        chunkFileNames: 'scripts/chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          const info = name.split('.');
          const ext = info[info.length - 1] || '';
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `views/icons/[name][extname]`;
          }
          if (/css/i.test(ext)) {
            return `views/style/[name][extname]`;
          }
          if (/woff2?/i.test(ext)) {
            return `views/fonts/[name][extname]`;
          }
          return `assets/[name][extname]`;
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env['NODE_ENV'] || 'development')
  }
});