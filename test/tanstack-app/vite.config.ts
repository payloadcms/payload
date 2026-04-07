import type { PluginOption, ViteDevServer } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function payloadSsrMiddleware(): PluginOption {
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
              method: req.method,
              headers: Object.fromEntries(
                Object.entries(req.headers)
                  .filter(([, v]) => v != null)
                  .map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v]),
              ),
            })

            const webRes = (await serverEntry.default.fetch(webReq)) as Response

            res.statusCode = webRes.status
            webRes.headers.forEach((value: string, key: string) => {
              res.setHeader(key, value)
            })

            const body = await webRes.arrayBuffer()
            res.end(Buffer.from(body))
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
  server: {
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@payload-config': path.resolve(
        __dirname,
        '..',
        process.env.PAYLOAD_TEST_SUITE || '_community',
        'config.ts',
      ),
    },
    tsconfigPaths: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        importers: [
          {
            findFileUrl(url: string) {
              if (url.startsWith('~@payloadcms/ui/scss')) {
                return new URL(
                  'file://' + path.resolve(__dirname, '../../packages/ui/src/scss/styles.scss'),
                )
              }
              return null
            },
          },
        ],
      },
    },
  },
  optimizeDeps: {
    exclude: [
      'sharp',
      'payload',
      '@payloadcms/ui',
      '@payloadcms/translations',
      '@payloadcms/tanstack-start',
    ],
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
  plugins: [
    tanstackStart({
      srcDirectory: 'src',
      router: {
        routesDirectory: 'app',
        autoCodeSplitting: true,
      },
    }),
    viteReact(),
    payloadSsrMiddleware(),
  ],
  envDir: path.resolve(__dirname, '../..'),
})
