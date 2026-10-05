import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
///*
export default defineConfig({ // Local development
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
//*/
/*
export default defineConfig({
  plugins: [react()],
  base: '/<your-github-repo-name>/',   // e.g. '/mp2/' -- must match the repo name
})
  */