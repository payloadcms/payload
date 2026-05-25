import { createRequire } from 'node:module'
import path from 'node:path'
import { defineConfig } from 'vite'
import vinext from 'vinext'

const require = createRequire(import.meta.url)

const payloadBrowserInteropDependencies = [
  { importer: 'payload', specifier: 'ajv' },
  { importer: 'payload', specifier: 'bson-objectid' },
  { importer: 'payload', specifier: 'deepmerge' },
  { importer: 'payload', specifier: 'pluralize' },
  { importer: '@payloadcms/ui', specifier: 'md5' },
  { importer: '@payloadcms/ui', specifier: 'react/compiler-runtime' },
]

const payloadBrowserInteropAliases = Object.fromEntries(
  payloadBrowserInteropDependencies.map(({ importer, specifier }) => [
    specifier,
    require.resolve(specifier, {
      paths: [path.dirname(require.resolve(importer))],
    }),
  ]),
)

export default defineConfig({
  optimizeDeps: {
    include: payloadBrowserInteropDependencies.map(({ specifier }) => specifier),
  },
  plugins: [vinext()],
  resolve: {
    alias: payloadBrowserInteropAliases,
  },
})
