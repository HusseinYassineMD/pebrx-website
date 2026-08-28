import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/pebrx-website/' : '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        science: resolve(__dirname, 'science.html'),
        pipeline: resolve(__dirname, 'pipeline.html'),
        leadership: resolve(__dirname, 'leadership.html'),
        publications: resolve(__dirname, 'publications.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
});
