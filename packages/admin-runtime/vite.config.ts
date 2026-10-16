import type { Plugin } from 'vite'

import { withPayload } from '@payloadcms/tanstack-start'
import react from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** The modules `src/index.ts` hands over. */
const hostModules = ['payload', 'payload/internal', 'payload/shared']

/**
 * On the server, `payload` must be the host app's instance, the one its config was built with, and the
 * host may have bundled it. So the server bundles read the modules `src/index.ts` hands over instead of
 * importing their own.
 */
const useHostPayload = (): Plugin => ({
  name: 'payload-host-modules',
  applyToEnvironment: (environment) => environment.name !== 'client',
  renderChunk(code, chunk) {
    const dynamicPayloadImport = chunk.dynamicImports.find((id) => /^payload(?:\/|$)/.test(id))
    if (dynamicPayloadImport) {
      throw new Error(`${chunk.fileName} imports "${dynamicPayloadImport}" dynamically`)
    }
    const rewritten = code.replace(
      /import\s*(?:(\*\s*as\s+[\w$]+|\{[^}]*\})\s*from\s*)?["'](payload(?:\/[\w-]+)?)["'];?/g,
      (_, clause: string | undefined, specifier: string) => {
        if (!hostModules.includes(specifier)) {
          throw new Error(`Add "${specifier}" to the modules src/index.ts hands over`)
        }
        const host = `globalThis.__payload_host__[${JSON.stringify(specifier)}]`
        // A side-effect import: the host has already loaded the module.
        if (!clause) {
          return ''
        }
        return clause.startsWith('*')
          ? `const ${clause.replace(/^\*\s*as\s+/, '')}=${host};`
          : `const ${clause.replace(/\s+as\s+/g, ':')}=${host};`
      },
    )
    const unhandled = /(?:from|import)\s*["']payload["'/]/.exec(rewritten)
    if (unhandled) {
      const snippet = rewritten.slice(Math.max(0, unhandled.index - 80), unhandled.index + 60)
      throw new Error(`useHostPayload can't rewrite this \`payload\` import: ${snippet}`)
    }
    return rewritten === code ? null : { code: rewritten, map: null }
  },
})

// Values Next.js inlines at compile time. The browser bundle reads them at runtime (see entry.ssr.tsx),
// the server bundles from the real environment.
const nextEnv = ['NEXT_BASE_PATH', 'NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH', 'NEXT_TRAILING_SLASH']
const serverDefine = {
  ...Object.fromEntries(nextEnv.map((name) => [`process.env.${name}`, `process.env.${name}`])),
  // The browser bundle is a production build, and RSC payloads don't mix development and production.
  'process.env.NODE_ENV': '"production"',
}

// Reuses Payload's Vite setup from the TanStack Start adapter, without TanStack itself.
export default defineConfig(
  withPayload(
    ({ pluginOptions }) => ({
      // Served by the runtime under `<admin route>/__payload/` (ASSETS_PATH in entry.rsc.tsx).
      base: '/admin/__payload/',
      // Also strips comments, so the `payload` imports useHostPayload sees are real ones.
      build: { minify: true },
      define: Object.fromEntries(
        nextEnv.map((name) => [`process.env.${name}`, `globalThis.__PAYLOAD_ENV__.${name}`]),
      ),
      environments: {
        client: { build: { outDir: 'dist/runtime/client' } },
        // Every `payload` module comes from the host (useHostPayload). esbuild ships a native binary; the
        // custom components compiler loads it from node_modules.
        rsc: {
          build: {
            outDir: 'dist/runtime/rsc',
            rollupOptions: { external: [/^payload(?:\/|$)/, 'esbuild'] },
          },
          define: serverDefine,
          // Self-contained: everything but the externals above is bundled.
          resolve: { noExternal: true },
        },
        ssr: {
          build: { outDir: 'dist/runtime/ssr', rollupOptions: { external: [/^payload(?:\/|$)/] } },
          define: serverDefine,
          resolve: { noExternal: true },
        },
      },
      plugins: [
        rsc({
          ...pluginOptions.rsc,
          entries: {
            client: './runtime/entry.browser.tsx',
            rsc: './runtime/entry.rsc.tsx',
            ssr: './runtime/entry.ssr.tsx',
          },
        }),
        react(pluginOptions.react),
        useHostPayload(),
      ],
    }),
    // Only read by the adapter's dev config reload, which `vite build` doesn't run.
    { payloadConfigPath: path.resolve(dirname, 'runtime/entry.rsc.tsx') },
  ),
)
