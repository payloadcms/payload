import type { PluginOption, ViteDevServer } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED = 'false'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nodeBuiltinNames = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'diagnostics_channel',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
]

const serverOnlyClientSpecifiers: Array<RegExp | string> = [
  // Node builtins: node: prefix covers node:fs, node:os, etc.
  /^node:/,
  // Bare builtin names with optional sub-paths (e.g. fs, fs/promises)
  new RegExp(`^(${nodeBuiltinNames.join('|')})(\\/|$)`),
  // Payload server-only modules
  '@payload-config',
  /^@payloadcms\/next\/rsc/,
  /^@payloadcms\/richtext-lexical\/rsc/,
  /^@payloadcms\/richtext-slate\/rsc/,
  /^@payloadcms\/tanstack-start\/(layouts|server|views\/server)/,
  // Server-only npm packages
  'sharp',
  'busboy',
  'croner',
  'pino',
  'pino-pretty',
  'prompts',
  'ws',
  'undici',
  'get-tsconfig',
  /^file-type/,
  /^react-dom\/server/,
]

function replaceProcessCwd(): PluginOption {
  return {
    name: 'payload:replace-process-cwd',
    transform(code, id, options) {
      if (options?.ssr) {
        return
      }
      if (code.includes('process.cwd') && !id.includes('node_modules/.vite')) {
        return code.replace(/process\.cwd\(\)/g, '"/"')
      }
    },
  }
}

function tanstackVirtualModuleFallback(): PluginOption {
  const headScriptsId = 'tanstack-start-injected-head-scripts:v'
  const resolvedId = '\0' + headScriptsId

  return {
    name: 'payload:tanstack-virtual-fallback',
    load(id) {
      if (id === resolvedId) {
        return 'export const injectedHeadScripts = ""'
      }
    },
    resolveId(id) {
      if (id === headScriptsId) {
        return resolvedId
      }
    },
  }
}

function payloadServerFunctionEndpoint(): PluginOption {
  return {
    name: 'payload:server-function-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/server-function', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          }
          const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'))

          const serverModule = await server.ssrLoadModule('/src/functions/serverFunction.api.ts')

          const result = await serverModule.handleServerFunctionRequest(body, req.headers)

          res.statusCode = 200
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (e) {
          console.error('[payload server-function error]', e)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: (e as Error).message }))
        }
      })
    },
  }
}

function payloadSsrMiddleware(): PluginOption {
  const viteDevScripts = `
<script type="module" src="/@vite/client"></script>
<script type="module">
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>`

  return {
    name: 'payload:ssr-middleware',
    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use(async (req, res) => {
          if (req.originalUrl) {
            req.url = req.originalUrl
          }

          const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
          const method = req.method || 'GET'
          const hasBody = method !== 'GET' && method !== 'HEAD'

          try {
            const { Readable } = await import('node:stream')
            const serverEntry = await server.ssrLoadModule('virtual:tanstack-start-server-entry')

            const requestInit: { duplex?: string } & RequestInit = {
              headers: Object.fromEntries(
                Object.entries(req.headers)
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v]),
              ),
              method,
            }

            if (hasBody) {
              requestInit.body = Readable.toWeb(req) as ReadableStream
              requestInit.duplex = 'half'
            }

            const webReq = new Request(url.href, requestInit)
            const webRes = (await serverEntry.default.fetch(webReq)) as Response

            res.statusCode = webRes.status
            webRes.headers.forEach((value: string, key: string) => {
              res.setHeader(key, value)
            })

            const contentType = webRes.headers.get('content-type') || ''
            const body = await webRes.arrayBuffer()
            let html = Buffer.from(body)

            if (contentType.includes('text/html')) {
              const htmlStr = html.toString('utf-8')
              html = Buffer.from(htmlStr.replace('<head>', `<head>${viteDevScripts}`))
            }

            res.end(html)
          } catch (e) {
            console.error('[payload ssr error]', e)
            try {
              server.ssrFixStacktrace(e as Error)
            } catch {
              // ssrFixStacktrace may fail for non-Error objects
            }

            res.statusCode = 500
            res.setHeader('content-type', 'text/html')
            res.end(`<pre>${(e as Error).stack || e}</pre>`)
          }
        })
      }
    },
  }
}

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        importers: [
          {
            findFileUrl(url: string) {
              if (url.startsWith('~@payloadcms/ui/scss')) {
                return new URL(
                  'file://' + path.resolve(__dirname, '../packages/ui/src/scss/styles.scss'),
                )
              }
              return null
            },
          },
        ],
        silenceDeprecations: ['import', 'global-builtin'],
      } as any,
    },
  },
  define: {
    global: 'globalThis',
    'process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED': JSON.stringify('false'),
  },
  envDir: path.resolve(__dirname, '..'),
  optimizeDeps: {
    exclude: [
      'sharp',
      '@payloadcms/ui',
      '@payloadcms/translations',
      '@payloadcms/tanstack-start',
      'payload',
      'pino',
      'pino-pretty',
      'busboy',
      'get-tsconfig',
      'ws',
      'croner',
      'prompts',
    ],
  },
  plugins: [
    payloadServerFunctionEndpoint(),
    replaceProcessCwd(),
    tanstackVirtualModuleFallback(),
    tanstackStart({
      importProtection: {
        client: {
          excludeFiles: [],
          specifiers: serverOnlyClientSpecifiers,
        },
        // The generated import map intentionally aggregates client-only admin
        // components, and the TanStack admin view is a client-rendered shell.
        // Ignore those importers during server boundary checks.
        ignoreImporters: [
          /^src\/importMap\.js(?:\?.*)?$/,
          /^\.\.\/packages\/tanstack-start\/src\/views\/AdminView\.tsx(?:\?.*)?$/,
        ],
        include: ['**/*'],
        mockAccess: 'warn',
        onViolation: (info) => {
          if (
            info.envType === 'server' &&
            info.importer.includes('/packages/richtext-lexical/src/exports/client/index.ts') &&
            info.resolved?.includes('/packages/richtext-lexical/src/') &&
            info.resolved.includes('.client.')
          ) {
            return false
          }

          if (
            info.envType === 'server' &&
            (info.importer.includes('/packages/tanstack-start/src/views/AdminView.tsx') ||
              info.importer.includes('/packages/ui/src/')) &&
            info.resolved.includes('.client.')
          ) {
            return false
          }
        },
      },
      router: {
        autoCodeSplitting: true,
        routesDirectory: 'app',
      } as any,
      srcDirectory: 'src',
    }),
    viteReact({
      exclude: [],
      include: /\.[jt]sx?$/,
    }),
    payloadSsrMiddleware(),
  ],
  resolve: {
    alias: [
      {
        find: '@payload-config',
        replacement: path.resolve(
          __dirname,
          '..',
          'test',
          process.env.PAYLOAD_TEST_SUITE || '_community',
          'config.ts',
        ),
      },
    ],
    tsconfigPaths: true,
  } as any,
  server: {
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
  },
  ssr: {
    external: [
      'drizzle-kit',
      'drizzle-kit/api',
      'drizzle-orm',
      'sharp',
      'libsql',
      'require-in-the-middle',
      'json-schema-to-typescript',
      'pino',
      'pino-pretty',
      'graphql',
      'mongodb',
      'mongoose',
      'better-sqlite3',
      'pg',
      'pg-native',
      'nodemailer',
      'aws4',
    ],
  },
})
