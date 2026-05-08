import type { PluginOption, UserConfigFnObject } from 'vite'

import fs from 'node:fs'
import { builtinModules } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface PayloadPluginOptions {
  /** Additional resolve aliases */
  additionalAliases?: Array<{ find: RegExp | string; replacement: string }>
  /** Additional import protection ignoreImporters patterns */
  additionalIgnoreImporters?: RegExp[]
  /** Extra optimizeDeps.include entries */
  additionalOptimizeDepsInclude?: string[]
  /** Extra ssr.external entries */
  additionalSsrExternal?: string[]
  /** Path to the user's payload.config.ts (required) */
  payloadConfigPath: string
  /** Extra Vite plugins to include */
  plugins?: PluginOption[]
  /** @vitejs/plugin-react instance — must be passed by consumer to ensure correct resolution */
  reactPlugin: PluginOption
  /** TanStack router routes directory relative to srcDirectory. Defaults to 'app' */
  routesDirectory?: string
  /** @vitejs/plugin-rsc instance — required for RSC support, must be passed by consumer */
  rscPlugin: PluginOption
  /** TanStack source directory. Defaults to 'src' */
  srcDirectory?: string
  /** tanstackStart from '@tanstack/react-start/plugin/vite' — must be passed by consumer to ensure correct resolution */
  tanstackStart: typeof import('@tanstack/react-start/plugin/vite').tanstackStart
}

const serverOnlyClientSpecifiers: Array<RegExp | string> = [
  /^node:/,
  new RegExp(`^(${builtinModules.join('|')})(\\/|$)`),
  '@payload-config',
  /^@payloadcms\/next\/rsc/,
  /^@payloadcms\/richtext-lexical\/rsc/,
  /^@payloadcms\/richtext-slate\/rsc/,
  /^@payloadcms\/tanstack-start\/(layouts|rsc|server|views\/server)/,
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

const dateFnsLocales = [
  'ar',
  'az',
  'bg',
  'bn',
  'ca',
  'cs',
  'da',
  'de',
  'en-US',
  'es',
  'et',
  'fa-IR',
  'fr',
  'he',
  'hr',
  'hu',
  'id',
  'is',
  'it',
  'ja',
  'ko',
  'lt',
  'lv',
  'nb',
  'nl',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'sr',
  'sr-Latn',
  'sv',
  'ta',
  'th',
  'tr',
  'uk',
  'vi',
  'zh-CN',
  'zh-TW',
]

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveShimPath(shimName: string): string {
  const tsPath = path.resolve(__dirname, 'shims', shimName + '.ts')
  if (fs.existsSync(tsPath)) {
    return tsPath
  }
  return path.resolve(__dirname, 'shims', shimName + '.js')
}

function safeSSRConsole(): PluginOption {
  let patched = false
  return {
    name: 'payload:safe-ssr-console',
    configureServer() {
      if (patched) {
        return
      }
      patched = true
      const orig = console.error
      console.error = function (...args: unknown[]) {
        try {
          orig.apply(console, args)
        } catch {
          // react-dom SSR dev mode passes non-stringifiable objects to console.error
        }
      }
    },
  }
}

function ssrStripDistStyleImports(): PluginOption {
  return {
    name: 'payload:ssr-strip-dist-style-imports',
    enforce: 'pre',
    load(id) {
      if (id === '\0ssr-empty-style') {
        return ''
      }
    },
    resolveId(id, importer, options) {
      if (!options?.ssr) {
        return
      }
      const isStyleFile = /\.(?:s?css|less)$/.test(id)
      if (!isStyleFile) {
        return
      }
      if (importer && /\/dist\//.test(importer)) {
        return '\0ssr-empty-style'
      }
      if (/^@?[a-z]/.test(id) && !id.startsWith('.') && !id.startsWith('/')) {
        return '\0ssr-empty-style'
      }
    },
  }
}

/**
 * Wraps CJS `node_modules` files in ESM-compatible code when served to the client.
 *
 * Packages in `optimizeDeps.exclude` (like `payload`, `@payloadcms/ui`) import CJS
 * dependencies that Vite serves via raw `/@fs/` URLs, bypassing pre-bundling. The
 * browser fails to parse them because they use `module.exports` / `exports.X` syntax.
 *
 * This plugin detects CJS patterns in the transform phase and wraps them with a
 * CommonJS-like runtime shim so the browser can execute them as ESM.
 */
function wrapCjsForClient(): PluginOption {
  return {
    name: 'payload:wrap-cjs-client',
    apply: 'serve',
    enforce: 'post',
    transform(code, id, options) {
      if (options?.ssr) {
        return
      }

      if (!id.includes('/node_modules/') || id.includes('/node_modules/.vite/')) {
        return
      }

      const cleanId = id.replace(/\?.*$/, '')
      if (!cleanId.endsWith('.js') && !cleanId.endsWith('.cjs')) {
        return
      }

      if (code.includes('import ') || code.includes('export ')) {
        return
      }

      if (
        !code.includes('module.exports') &&
        !code.includes('exports.') &&
        !code.includes('Object.defineProperty(exports')
      ) {
        return
      }

      const namedExports = extractCjsExports(code)
      const names = Object.keys(namedExports)

      const wrapped = [
        `var module = { exports: {} };`,
        `var exports = module.exports;`,
        ``,
        code,
        ``,
        `var __cjs_result__ = module.exports;`,
        `export default __cjs_result__;`,
        ...names.map(
          (name) =>
            `export var ${name} = typeof __cjs_result__ === 'object' && __cjs_result__ !== null ? __cjs_result__["${name}"] : undefined;`,
        ),
      ].join('\n')

      return { code: wrapped, map: null }
    },
  }
}

function extractCjsExports(code: string): Record<string, true> {
  const found: Record<string, true> = {}
  const patterns = [
    /exports\.(\w+)\s*=/g,
    /exports\[["'](\w+)["']\]\s*=/g,
    /Object\.defineProperty\(exports,\s*["'](\w+)["']/g,
  ]
  for (const re of patterns) {
    let m
    while ((m = re.exec(code)) !== null) {
      const name = m[1]!
      if (name !== '__esModule' && name !== 'default') {
        found[name] = true
      }
    }
  }
  return found
}

/**
 * Resolves `/client` subpath exports for `@payloadcms/plugin-*` and `@payloadcms/storage-*`
 * packages when normal Vite resolution fails (common in monorepo dev where the package
 * `exports` field may not be picked up for pre-excluded dependencies).
 */
function resolvePayloadPluginClientExports(): PluginOption {
  return {
    name: 'payload:resolve-plugin-client-exports',
    enforce: 'pre',
    async resolveId(id, importer, options) {
      if (!/^@payloadcms\/(?:plugin|storage)-[^/]+\/client$/.test(id)) {
        return
      }
      const resolved = await this.resolve(id, importer, { ...options, skipSelf: true })
      if (resolved) {
        return resolved
      }
      const pkgName = id.replace(/\/client$/, '')
      const pkgResolved = await this.resolve(pkgName, importer, { ...options, skipSelf: true })
      if (pkgResolved) {
        const pkgDir = path.dirname(pkgResolved.id)
        const candidates = [
          path.resolve(pkgDir, 'src', 'exports', 'client.ts'),
          path.resolve(pkgDir, 'src', 'exports', 'client.js'),
          path.resolve(pkgDir, 'dist', 'exports', 'client.js'),
        ]
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            return candidate
          }
        }
      }
    },
  }
}

function payloadTransforms(): PluginOption {
  const headScriptsId = 'tanstack-start-injected-head-scripts:v'
  const resolvedHeadScriptsId = '\0' + headScriptsId

  return {
    name: 'payload:transforms',
    load(id) {
      if (id === resolvedHeadScriptsId) {
        return 'export const injectedHeadScripts = ""'
      }
    },
    resolveId(id) {
      if (id === headScriptsId) {
        return resolvedHeadScriptsId
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

function injectViteDevScripts(): PluginOption {
  const devScripts = `<script type="module" src="/@vite/client"></script>
<script type="module">
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>`

  return {
    name: 'payload:inject-vite-dev-scripts',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        let injected = false
        const origWrite = res.write
        const origEnd = res.end

        function tryInject(chunk: any): any {
          if (injected || chunk == null) {
            return chunk
          }
          const ct = res.getHeader('content-type')
          if (typeof ct !== 'string' || !ct.includes('text/html')) {
            return chunk
          }
          const str =
            typeof chunk === 'string'
              ? chunk
              : Buffer.isBuffer(chunk)
                ? chunk.toString()
                : chunk instanceof Uint8Array
                  ? Buffer.from(chunk).toString()
                  : null
          if (str && str.includes('<head>')) {
            injected = true
            return str.replace('<head>', `<head>${devScripts}`)
          }
          return chunk
        }

        res.write = function (this: any, chunk: any, encodingOrCb?: any, cb?: any) {
          return origWrite.call(this, tryInject(chunk), encodingOrCb, cb)
        } as typeof res.write
        res.end = function (this: any, chunk?: any, encodingOrCb?: any, cb?: any) {
          return origEnd.call(this, tryInject(chunk), encodingOrCb, cb)
        } as typeof res.end
        next()
      })
    },
  }
}

// --- Main export ---

export function payloadPlugin(options: PayloadPluginOptions): UserConfigFnObject {
  const {
    additionalAliases = [],
    additionalIgnoreImporters = [],
    additionalOptimizeDepsInclude = [],
    additionalSsrExternal = [],
    payloadConfigPath,
    plugins: extraPlugins = [],
    reactPlugin,
    routesDirectory = 'app',
    rscPlugin,
    srcDirectory = 'src',
    tanstackStart,
  } = options

  process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED = 'true'

  const hoistNonReactStaticsShimPath = resolveShimPath('hoistNonReactStatics')
  const propTypesShimPath = resolveShimPath('propTypes')

  return ({ command }) => {
    const isServe = command === 'serve'

    return {
      css: {
        preprocessorOptions: {
          scss: {
            silenceDeprecations: ['import', 'global-builtin'],
          } as any,
        },
      },
      define: {
        global: 'globalThis',
        'process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED': JSON.stringify('true'),
      },
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
          'file-type',
        ],
        include: [
          '@payloadcms/ui > sonner',
          '@payloadcms/ui > @faceless-ui/modal',
          '@payloadcms/ui > @faceless-ui/window-info',
          '@payloadcms/ui > @faceless-ui/scroll-info',
          '@payloadcms/ui > @dnd-kit/core',
          '@payloadcms/ui > @dnd-kit/sortable',
          '@payloadcms/ui > @dnd-kit/utilities',
          '@payloadcms/ui > react-datepicker',
          '@payloadcms/ui > react-select',
          '@payloadcms/ui > react-select/creatable',
          '@payloadcms/ui > react-image-crop',
          '@payloadcms/ui > @monaco-editor/react',
          '@payloadcms/ui > date-fns',
          '@payloadcms/ui > date-fns/transpose',
          '@payloadcms/ui > @date-fns/tz/date/mini',
          '@payloadcms/ui > uuid',
          '@payloadcms/ui > use-context-selector',
          '@payloadcms/ui > bson-objectid',
          '@payloadcms/ui > dequal',
          '@payloadcms/ui > object-to-formdata',
          '@payloadcms/ui > md5',
          'payload > deepmerge',
          'payload > pluralize',
          'payload > ajv',
          'payload > jose',
          'payload > dataloader',
          'payload > console-table-printer',
          'payload > sanitize-filename',
          'payload > image-size',
          'payload > image-size/fromFile',
          'payload > undici',
          'payload > ipaddr.js',
          'payload > path-to-regexp',
          'payload > ci-info',
          'payload > range-parser',
          'scheduler',
          ...dateFnsLocales.map((l) => `@payloadcms/translations > date-fns/locale/${l}`),
          ...additionalOptimizeDepsInclude,
        ],
      },
      plugins: [
        {
          name: 'payload:rsc-client-boundaries',
          config() {
            return {
              environments: {
                rsc: {
                  resolve: {
                    noExternal: ['@payloadcms/ui', '@payloadcms/richtext-lexical'],
                  },
                },
              },
            }
          },
        },
        resolvePayloadPluginClientExports(),
        wrapCjsForClient(),
        ssrStripDistStyleImports(),
        safeSSRConsole(),
        payloadTransforms(),
        rscPlugin,
        tanstackStart({
          importProtection: {
            client: {
              excludeFiles: [],
              specifiers: serverOnlyClientSpecifiers,
            },
            ignoreImporters: [/^src\/importMap\.js(?:\?.*)?$/, ...additionalIgnoreImporters],
            include: ['**/*'],
            mockAccess: 'warn',
            onViolation: (info) => {
              if (
                info.envType === 'server' &&
                info.importer.includes('/richtext-lexical/') &&
                info.importer.includes('/exports/client/index.ts') &&
                info.resolved?.includes('.client.')
              ) {
                return false
              }

              if (
                info.envType === 'server' &&
                ((info.importer.includes('/tanstack-start/') &&
                  info.importer.includes('/views/AdminView.tsx')) ||
                  info.importer.includes('/ui/')) &&
                info.resolved.includes('.client.')
              ) {
                return false
              }

              // Diff converters are RSC-only (server components) and legitimately use Node.js crypto
              if (
                info.importer.includes('/richtext-lexical/') &&
                info.importer.includes('/field/Diff/')
              ) {
                return false
              }

              // Core payload package is server-only; its barrel export gets traced through
              // RSC entry points but never actually runs on the client
              if (info.importer.includes('/packages/payload/')) {
                return false
              }

              // RSC client-reference facades legitimately import .client. files
              // to create the client boundary references
              if (
                info.envType === 'server' &&
                info.importer.includes('vite-rsc/client-references')
              ) {
                return false
              }
            },
          },
          router: {
            autoCodeSplitting: true,
            routesDirectory,
          } as any,
          rsc: { enabled: true },
          srcDirectory,
        }),
        reactPlugin,
        isServe && injectViteDevScripts(),
        ...extraPlugins,
      ],
      resolve: {
        alias: [
          {
            find: '@payload-config',
            replacement: path.resolve(payloadConfigPath),
          },
          ...(isServe
            ? [
                {
                  find: 'hoist-non-react-statics',
                  replacement: hoistNonReactStaticsShimPath,
                },
                {
                  find: 'prop-types',
                  replacement: propTypesShimPath,
                },
              ]
            : []),
          ...additionalAliases,
        ],
        dedupe: ['react', 'react-dom', 'scheduler', '@payloadcms/ui'],
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
        tsconfigPaths: true,
      } as any,
      server: {
        warmup: {
          clientFiles: ['./src/importMap.js'],
        },
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
          'pluralize',
          'console-table-printer',
          ...additionalSsrExternal,
        ],
        noExternal: [/^@payloadcms\/plugin-/, /^@payloadcms\/storage-/],
      },
    }
  }
}
