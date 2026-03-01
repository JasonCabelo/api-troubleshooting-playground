import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the API Troubleshooting Playground
// This sets up the React plugin and development server settings
export default defineConfig({
  plugins: [react()],
  
  // Base path for production - update this to your domain subfolder if needed
  base: process.env.VITE_BASE_PATH || '/',
  
  // Development server configuration
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  
  // Production build configuration
  build: {
    // Output directory for production builds
    outDir: 'dist',
    // Generate source maps for production debugging
    sourcemap: false,
    // Minification options
    minify: 'terser',
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Rollup options for better bundling
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-axios': ['axios'],
          'vendor-syntax': ['react-syntax-highlighter']
        }
      }
    }
  },
  
  // Preview server for testing production build
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
