import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the API Troubleshooting Playground
// This sets up the React plugin and development server settings
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
