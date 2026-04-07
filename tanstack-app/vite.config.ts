import type { PluginOption, ViteDevServer } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

          try {
            const serverEntry = await server.ssrLoadModule('virtual:tanstack-start-server-entry')
            const webReq = new Request(url.href, {
              headers: Object.fromEntries(
                Object.entries(req.headers)
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v]),
              ),
              method: req.method,
            })

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
      },
    },
  },
  envDir: path.resolve(__dirname, '..'),
  optimizeDeps: {
    exclude: ['@payloadcms/ui', '@payloadcms/translations', '@payloadcms/tanstack-start'],
  },
  plugins: [
    tanstackVirtualModuleFallback(),
    tanstackStart({
      router: {
        autoCodeSplitting: true,
        routesDirectory: 'app',
      },
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
  },
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
