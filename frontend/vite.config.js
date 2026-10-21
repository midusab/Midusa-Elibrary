import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  build: {
    // Target modern browsers — smaller output, faster parse
    target: 'es2015',
    // Inline assets smaller than 4 KB to avoid extra HTTP requests
    assetsInlineLimit: 4096,
    // Split CSS per chunk for faster initial CSS loads
    cssCodeSplit: true,
    // No source maps in production (reduces bundle size)
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('framer-motion')) return 'vendor-framer';
            if (id.includes('lucide-react') || id.includes('react-icons')) return 'vendor-icons';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            return 'vendor-libs';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
