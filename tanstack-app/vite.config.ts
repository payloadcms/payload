import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const uiSrcDir = path.resolve(dirname, '../packages/ui/src')

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // Map ~@payloadcms/ui/scss to the actual source file
        loadPaths: [path.resolve(uiSrcDir, 'scss')],
      },
    },
  },
  optimizeDeps: {
    exclude: ['sharp'],
  },
  plugins: [
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({
      srcDirectory: 'app',
    } as any),
    react(),
  ],
  resolve: {
    alias: {
      // Handle tilde-prefixed node_modules imports in scss
      '~@payloadcms/ui/scss': path.resolve(uiSrcDir, 'scss/styles.scss'),
    },
  },
})
