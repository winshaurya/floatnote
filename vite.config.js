import { defineConfig } from 'vite';
import { resolve } from 'path';

const rootDir = process.cwd();

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Use Vite's default HTML entry resolution (root: 'src')
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
    },
  },
});