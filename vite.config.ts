import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for a React + TypeScript project.  
// See https://vitejs.dev/config/ for more details.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    // During development we proxy API requests to our local backend on port 4000.
    proxy: {
      '/api': {
        target: 'http://192.168.50.96:4000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Resolve .ts/.tsx extensions so imports don't need to specify file extensions.
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
  }
});