import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for a React + TypeScript project.  
// See https://vitejs.dev/config/ for more details.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During development we proxy API requests to our local backend on port 3000.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
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