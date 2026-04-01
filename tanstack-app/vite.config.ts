import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
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

// Packages that are Node.js-only and must not be bundled for the browser.
// Payload admin is RSC-based; in TanStack Start (isomorphic by default) we need
// to stub these so client-side hydration doesn't break when these are in the
// module graph.
const SERVER_ONLY_PACKAGES = [
  'sharp',
  'file-type',
  'mongoose',
  'mongodb',
  '@aws-sdk',
  'nodemailer',
  'pino',
  'better-sqlite3',
  // Node.js util built-in — used for isDeepStrictEqual in server-side Payload code
  'util',
  'node:util',
]

function serverOnlyStubPlugin(): Plugin {
  return {
    name: 'server-only-stub',
    enforce: 'pre',
    load(id) {
      if (id.startsWith('\0server-only-stub:')) {
        return readFileSync(path.resolve(dirname, 'server-only-stub.js'), 'utf-8')
      }
    },
    resolveId(id, _importer, options) {
      if (
        !options?.ssr &&
        SERVER_ONLY_PACKAGES.some((pkg) => id === pkg || id.startsWith(pkg + '/'))
      ) {
        return '\0server-only-stub:' + id
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
    serverOnlyStubPlugin(),
  ],
  resolve: {
    alias: {
      '~@payloadcms/ui/scss': path.resolve(uiSrcDir, 'scss/styles.scss'),
    },
  },
})
