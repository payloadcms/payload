import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const uiSrcDir = path.resolve(dirname, '../packages/ui/src')

// Compatibility shim: @tanstack/start-server-core@1.167 expects this virtual module
// but it's not provided by the currently published Vite plugin version.
function tanstackStartCompatPlugin(): Plugin {
  const virtualModuleId = 'tanstack-start-injected-head-scripts:v'
  const resolvedId = '\0' + virtualModuleId
  return {
    name: 'tanstack-start-compat',
    load(id) {
      if (id === resolvedId) {
        return 'export const injectedHeadScripts = undefined'
      }
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedId
      }
    },
  }
}

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [path.resolve(uiSrcDir, 'scss')],
      },
    },
  },
  optimizeDeps: {
    exclude: ['sharp', 'file-type'],
  },
  plugins: [
    tanstackStart({ srcDirectory: 'app' } as any),
    react(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStartCompatPlugin(),
  ],
  resolve: {
    alias: {
      '~@payloadcms/ui/scss': path.resolve(uiSrcDir, 'scss/styles.scss'),
    },
  },
})
