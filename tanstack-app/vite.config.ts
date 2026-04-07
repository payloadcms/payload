import type { PluginOption, ViteDevServer } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nodeBuiltins = new Set([
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
])

function isNodeBuiltin(id: string): boolean {
  const bare = id.startsWith('node:') ? id.slice(5) : id
  return nodeBuiltins.has(bare.split('/')[0])
}

const serverOnlyModuleStubs: Record<string, string> = {
  '@payload-config': 'export default {}',
  '@payloadcms/next/rsc': ['const noop = () => null', 'export const CollectionCards = noop'].join(
    '\n',
  ),
  '@payloadcms/richtext-lexical/rsc': [
    'const noop = () => null',
    'export const RscEntryLexicalCell = noop',
    'export const RscEntryLexicalField = noop',
    'export const LexicalDiffComponent = noop',
  ].join('\n'),
  '@payloadcms/tanstack-start/layouts': 'export const getLayoutData = async () => ({})',
  '@payloadcms/tanstack-start/server': [
    'function noop() {}',
    'const noopAsync = async () => ({})',
    'export const handleServerFunctions = noopAsync',
    'export const login = noopAsync',
    'export const logout = noopAsync',
    'export const refresh = noopAsync',
    'export const switchLanguage = noopAsync',
    'export const getImportMapOutputPath = noop',
    'export const initReq = noopAsync',
    'export const getAdminMeta = noopAsync',
    'export const tanstackServerAdapter = noop',
  ].join('\n'),
  '@payloadcms/tanstack-start/views/server':
    'export const getAdminPageData = async () => ({ data: {} })',
  busboy: 'function noop() {} export default noop; export const Busboy = noop;',
  croner: 'export class Cron { constructor() {} start() {} stop() {} next() { return null } }',
  'file-type':
    'export const fileTypeFromFile = async () => undefined; export const fileTypeFromBuffer = async () => undefined; export const fileTypeFromStream = async () => undefined;',
  'file-type/core':
    'export const fileTypeFromFile = async () => undefined; export const fileTypeFromBuffer = async () => undefined; export const fileTypeFromStream = async () => undefined;',
  'get-tsconfig':
    'export function getTsconfig() { return null }; export function parseTsconfig() { return {} }; export function createFilesMatcher() { return () => undefined }; export function createPathsMatcher() { return () => undefined };',
  'node:async_hooks': [
    'export class AsyncLocalStorage {',
    '  constructor() { this._store = undefined }',
    '  getStore() { return this._store }',
    '  run(store, fn, ...args) { const prev = this._store; this._store = store; try { return fn(...args) } finally { this._store = prev } }',
    '  enterWith(store) { this._store = store }',
    '  disable() {}',
    '}',
    'export class AsyncResource { constructor() {} runInAsyncScope(fn, ...args) { return fn(...args) } }',
    'export default { AsyncLocalStorage, AsyncResource }',
  ].join('\n'),
  'node:stream/web': [
    'export const ReadableStream = globalThis.ReadableStream',
    'export const WritableStream = globalThis.WritableStream',
    'export const TransformStream = globalThis.TransformStream',
    'export const ReadableStreamDefaultReader = globalThis.ReadableStreamDefaultReader || class {}',
    'export const ReadableStreamBYOBReader = globalThis.ReadableStreamBYOBReader || class {}',
    'export const WritableStreamDefaultWriter = globalThis.WritableStreamDefaultWriter || class {}',
    'export default { ReadableStream: globalThis.ReadableStream, WritableStream: globalThis.WritableStream, TransformStream: globalThis.TransformStream }',
  ].join('\n'),
  pino: 'function noop() {} const logger = { info: noop, warn: noop, error: noop, debug: noop, trace: noop, fatal: noop, child: () => logger, level: "silent" }; export default function() { return logger }; export const pino = () => logger;',
  'pino-pretty':
    'function noop() {} export default noop; export const build = noop; export const prettyFactory = noop;',
  prompts: 'export default async () => ({}); export const prompt = async () => ({});',
  'react-dom/server':
    'export function renderToString() { return "" }; export function renderToStaticMarkup() { return "" }; export default { renderToString() { return "" }, renderToStaticMarkup() { return "" } };',
  'react-dom/server.browser':
    'export function renderToString() { return "" }; export function renderToStaticMarkup() { return "" }; export default { renderToString() { return "" }, renderToStaticMarkup() { return "" } };',
  sharp: 'function noop() {} export default noop;',
  undici: 'export const fetch = globalThis.fetch; export class Agent {}; export default {};',
  ws: 'export default class WebSocket { constructor() {} send() {} close() {} addEventListener() {} removeEventListener() {} }; export class WebSocketServer { constructor() {} close() {} on() {} }',
}

const knownNodeExports: Record<string, string[]> = {
  assert: ['ok', 'equal', 'deepEqual', 'strictEqual', 'deepStrictEqual', 'throws'],
  child_process: ['spawn', 'execSync', 'exec', 'fork'],
  crypto: ['createHash', 'randomBytes', 'randomUUID'],
  dns: ['lookup', 'resolve', 'resolve4', 'resolve6', 'Resolver'],
  events: ['EventEmitter'],
  fs: [
    'readFileSync',
    'writeFileSync',
    'existsSync',
    'mkdirSync',
    'readdirSync',
    'statSync',
    'unlinkSync',
    'readFile',
    'writeFile',
    'stat',
    'mkdir',
    'promises',
    'createReadStream',
    'createWriteStream',
    'WriteStream',
    'ReadStream',
  ],
  http: ['IncomingMessage', 'ServerResponse', 'createServer', 'request', 'get', 'Agent'],
  https: ['createServer', 'request', 'get', 'Agent'],
  module: ['createRequire', 'builtinModules'],
  net: ['Socket', 'Server', 'createServer', 'createConnection'],
  os: ['tmpdir', 'homedir', 'platform', 'arch', 'cpus', 'hostname'],
  path: [
    'resolve',
    'join',
    'dirname',
    'basename',
    'extname',
    'relative',
    'isAbsolute',
    'normalize',
    'parse',
    'format',
    'sep',
    'delimiter',
    'posix',
    'win32',
  ],
  querystring: ['stringify', 'parse', 'encode', 'decode'],
  stream: ['Readable', 'Writable', 'Transform', 'Duplex', 'PassThrough', 'pipeline'],
  url: ['pathToFileURL', 'fileURLToPath', 'URL', 'URLSearchParams'],
  util: ['isDeepStrictEqual', 'promisify', 'inspect', 'deprecate', 'format', 'types'],
}

function generateNodeBuiltinStub(importSource: string): string {
  const lines = [
    'function noop() { return undefined }',
    'const noopAsync = async () => undefined',
    'const noopProxy = new Proxy({}, { get: () => noop })',
    'export default noopProxy',
  ]
  const bare = importSource.startsWith('node:') ? importSource.slice(5) : importSource
  const exports = knownNodeExports[bare] || []
  for (const name of exports) {
    if (name === 'promises') {
      lines.push(`export const ${name} = noopProxy`)
    } else if (name === 'sep') {
      lines.push("export const sep = '/'")
    } else if (name === 'delimiter') {
      lines.push("export const delimiter = ':'")
    } else if (name === 'posix' || name === 'win32' || name === 'types') {
      lines.push(`export const ${name} = noopProxy`)
    } else if (name === 'builtinModules') {
      lines.push('export const builtinModules = []')
    } else {
      lines.push(`export const ${name} = noop`)
    }
  }
  return lines.join('\n')
}

function stubServerOnlyModules(): PluginOption {
  const prefix = '\0virtual:server-only-stub:'

  return {
    name: 'payload:stub-server-only-modules',
    enforce: 'pre',
    load(id) {
      if (!id.startsWith(prefix)) {
        return
      }
      const moduleName = id.slice(prefix.length)
      if (moduleName in serverOnlyModuleStubs) {
        return serverOnlyModuleStubs[moduleName]
      }
      if (isNodeBuiltin(moduleName)) {
        return generateNodeBuiltinStub(moduleName)
      }
      return 'export default {}'
    },
    resolveId(id, _importer, options) {
      if (options.ssr) {
        return
      }
      if (id in serverOnlyModuleStubs || isNodeBuiltin(id)) {
        return prefix + id
      }
      if (id.includes('/test/') && id.endsWith('config.ts')) {
        return prefix + '@payload-config'
      }
    },
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
      },
    },
  },
  define: {
    global: 'globalThis',
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
    stubServerOnlyModules(),
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
