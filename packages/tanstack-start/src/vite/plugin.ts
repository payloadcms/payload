import type { PluginOption, UserConfigFnObject } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import fs from 'node:fs'
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
  /** Directory for .env files. Defaults to process.cwd() */
  envDir?: string
  /** Path to the user's payload.config.ts (required) */
  payloadConfigPath: string
  /** Extra Vite plugins to include */
  plugins?: PluginOption[]
  /** Dev server port. Defaults to process.env.PORT || 3000 */
  port?: number
  /** TanStack router routes directory relative to srcDirectory. Defaults to 'app' */
  routesDirectory?: string
  /** Additional SCSS importers for css.preprocessorOptions.scss */
  scssImporters?: Array<{ findFileUrl: (url: string) => null | URL }>
  /** TanStack source directory. Defaults to 'src' */
  srcDirectory?: string
  /** Server warmup client files */
  warmupClientFiles?: string[]
}

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
  /^node:/,
  new RegExp(`^(${nodeBuiltinNames.join('|')})(\\/|$)`),
  '@payload-config',
  /^@payloadcms\/next\/rsc/,
  /^@payloadcms\/richtext-lexical\/rsc/,
  /^@payloadcms\/richtext-slate\/rsc/,
  /^@payloadcms\/tanstack-start\/(layouts|server|views\/server)/,
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getShimPath(shimName: string): string {
  return path.resolve(__dirname, 'shims', shimName + '.ts')
}

function getDistShimPath(shimName: string): string {
  return path.resolve(__dirname, 'shims', shimName + '.js')
}

function resolveShimPath(shimName: string): string {
  const tsPath = getShimPath(shimName)
  if (fs.existsSync(tsPath)) {
    return tsPath
  }
  return getDistShimPath(shimName)
}

// --- Vite Plugins ---

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
          // Silently swallow React dev-mode formatting issues
        }
      }
    },
  }
}

function schedulerESMShim(): PluginOption {
  const virtualId = '\0scheduler-esm-shim'

  return {
    name: 'payload:scheduler-esm-shim',
    enforce: 'pre',
    load(id) {
      if (id === virtualId) {
        return `
import schedulerModule from 'scheduler';
export const {
  unstable_IdlePriority,
  unstable_ImmediatePriority,
  unstable_LowPriority,
  unstable_NormalPriority,
  unstable_UserBlockingPriority,
  unstable_cancelCallback,
  unstable_continueExecution,
  unstable_forceFrameRate,
  unstable_getCurrentPriorityLevel,
  unstable_getFirstCallbackNode,
  unstable_next,
  unstable_now,
  unstable_pauseExecution,
  unstable_requestPaint,
  unstable_runWithPriority,
  unstable_scheduleCallback,
  unstable_shouldYield,
  unstable_wrapCallback,
} = schedulerModule;
export default schedulerModule;
`
      }
    },
    resolveId(id, importer, options) {
      if (id === 'scheduler' && importer !== virtualId && !options?.ssr) {
        return virtualId
      }
    },
  }
}

function rewriteClientCJSImports(): PluginOption {
  const hoistNonReactStaticsShimPath = resolveShimPath('hoistNonReactStatics')
  const objectToFormDataShimPath = resolveShimPath('objectToFormData')
  const propTypesShimPath = resolveShimPath('propTypes')

  return {
    name: 'payload:rewrite-client-cjs-imports',
    enforce: 'pre',
    load(id) {
      if (id.includes('/@sentry/react/build/esm/hoist-non-react-statics.js')) {
        return `
export const hoistNonReactStatics = (targetComponent) => targetComponent;
`
      }

      if (id.includes('/@sentry/react/build/esm/')) {
        const sentryEsmCode = fs.readFileSync(id, 'utf8')

        if (sentryEsmCode.includes(`from 'hoist-non-react-statics'`)) {
          return sentryEsmCode.replaceAll(
            `from 'hoist-non-react-statics'`,
            `from ${JSON.stringify(hoistNonReactStaticsShimPath)}`,
          )
        }
      }

      if (id.includes('/ajv/') && id.endsWith('/dist/ajv.js')) {
        return `
export * from '/node_modules/.vite/deps/payload___ajv.js';
export { default } from '/node_modules/.vite/deps/payload___ajv.js';
`
      }

      if (id.includes('/deepmerge/') && id.endsWith('/dist/cjs.js')) {
        return `export { default } from '/node_modules/.vite/deps/payload___deepmerge.js';`
      }

      if (id.includes('/pluralize/') && id.endsWith('/pluralize.js')) {
        return `export { default } from '/node_modules/.vite/deps/payload___pluralize.js';`
      }

      if (id.includes('/dataloader/') && id.replace(/\?.*$/, '').endsWith('/index.js')) {
        return `export { default } from '/node_modules/.vite/deps/payload___dataloader.js';`
      }

      if (id.includes('/object-to-formdata/') && id.endsWith('/src/index.js')) {
        return `
export * from ${JSON.stringify(objectToFormDataShimPath)};
export { default } from ${JSON.stringify(objectToFormDataShimPath)};
`
      }

      if (id.includes('/prop-types/') && id.endsWith('/index.js')) {
        return `
export * from ${JSON.stringify(propTypesShimPath)};
export { default } from ${JSON.stringify(propTypesShimPath)};
`
      }

      if (
        id.includes('/hoist-non-react-statics/') &&
        id.endsWith('/dist/hoist-non-react-statics.cjs.js')
      ) {
        return `export { default } from ${JSON.stringify(hoistNonReactStaticsShimPath)};`
      }
    },
    resolveId(id, importer, options) {
      if (options?.ssr) {
        return
      }

      if (id === 'hoist-non-react-statics' && importer?.includes('/@sentry/react/')) {
        return hoistNonReactStaticsShimPath
      }

      if (id === 'prop-types' && importer?.includes('/react-transition-group/esm/')) {
        return propTypesShimPath
      }
    },
    transform(code, id, options) {
      if (options?.ssr) {
        return
      }

      let rewritten = code

      if (id.includes('/payload/dist/fields/validations.js')) {
        rewritten = rewritten.replace(
          `from 'ajv'`,
          `from '/node_modules/.vite/deps/payload___ajv.js'`,
        )
      }

      if (id.includes('/payload/dist/utilities/deepMerge.js')) {
        rewritten = rewritten.replace(
          `from 'deepmerge'`,
          `from '/node_modules/.vite/deps/payload___deepmerge.js'`,
        )
      }

      if (id.includes('/payload/dist/utilities/formatLabels.js')) {
        rewritten = rewritten.replace(
          `from 'pluralize'`,
          `from '/node_modules/.vite/deps/payload___pluralize.js'`,
        )
      }

      if (id.includes('/payload/dist/collections/dataloader.js')) {
        rewritten = rewritten.replace(
          `from 'dataloader'`,
          `from '/node_modules/.vite/deps/payload___dataloader.js'`,
        )
      }

      if (id.includes('/react-transition-group/esm/') && rewritten.includes(`from 'prop-types'`)) {
        rewritten = rewritten.replaceAll(
          `from 'prop-types'`,
          `from ${JSON.stringify(propTypesShimPath)}`,
        )
      }

      if (id.includes('/@sentry/react/') && rewritten.includes(`from 'hoist-non-react-statics'`)) {
        rewritten = rewritten.replaceAll(
          `from 'hoist-non-react-statics'`,
          `from ${JSON.stringify(hoistNonReactStaticsShimPath)}`,
        )
      }

      if (id.includes('/ui/') && (id.includes('/src/') || id.includes('/dist/'))) {
        rewritten = rewritten.replaceAll(
          `from 'object-to-formdata'`,
          `from ${JSON.stringify(objectToFormDataShimPath)}`,
        )
        rewritten = rewritten.replaceAll(
          `from 'bson-objectid'`,
          `from '/node_modules/.vite/deps/@payloadcms_ui___bson-objectid.js'`,
        )
        rewritten = rewritten.replaceAll(
          `from 'md5'`,
          `from '/node_modules/.vite/deps/@payloadcms_ui___md5.js'`,
        )
      }

      if (rewritten !== code) {
        return rewritten
      }
    },
  }
}

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
      // Strip style imports from dist/ directories (compiled output)
      if (importer && /\/dist\//.test(importer)) {
        return '\0ssr-empty-style'
      }
      // Strip style imports that reference packages (e.g. @payloadcms/ui/scss/app.scss)
      if (/^@?[a-z]/.test(id) && !id.startsWith('.') && !id.startsWith('/')) {
        return '\0ssr-empty-style'
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

        res.write = function (this: any, chunk: any, ...args: any[]) {
          return origWrite.call(this, tryInject(chunk), ...args)
        } as any
        res.end = function (this: any, chunk?: any, ...args: any[]) {
          return origEnd.call(this, tryInject(chunk), ...args)
        } as any
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
    envDir,
    payloadConfigPath,
    plugins: extraPlugins = [],
    port = Number(process.env.PORT) || 3000,
    routesDirectory = 'app',
    scssImporters = [],
    srcDirectory = 'src',
    warmupClientFiles,
  } = options

  process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED = 'false'

  const hoistNonReactStaticsShimPath = resolveShimPath('hoistNonReactStatics')
  const propTypesShimPath = resolveShimPath('propTypes')

  return ({ command }) => {
    const isServe = command === 'serve'

    return {
      css: {
        preprocessorOptions: {
          scss: {
            ...(scssImporters.length > 0 ? { importers: scssImporters } : {}),
            silenceDeprecations: ['import', 'global-builtin'],
          } as any,
        },
      },
      ...(envDir ? { envDir } : {}),
      define: {
        global: 'globalThis',
        'process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED': JSON.stringify('false'),
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
          'payload > file-type',
          'payload > sanitize-filename',
          'payload > image-size',
          'payload > image-size/fromFile',
          'payload > undici',
          'payload > ipaddr.js',
          'payload > path-to-regexp',
          'payload > ci-info',
          'payload > range-parser',
          '@payloadcms/translations > date-fns/locale/ar',
          '@payloadcms/translations > date-fns/locale/az',
          '@payloadcms/translations > date-fns/locale/bg',
          '@payloadcms/translations > date-fns/locale/bn',
          '@payloadcms/translations > date-fns/locale/ca',
          '@payloadcms/translations > date-fns/locale/cs',
          '@payloadcms/translations > date-fns/locale/da',
          '@payloadcms/translations > date-fns/locale/de',
          '@payloadcms/translations > date-fns/locale/en-US',
          '@payloadcms/translations > date-fns/locale/es',
          '@payloadcms/translations > date-fns/locale/et',
          '@payloadcms/translations > date-fns/locale/fa-IR',
          '@payloadcms/translations > date-fns/locale/fr',
          '@payloadcms/translations > date-fns/locale/he',
          '@payloadcms/translations > date-fns/locale/hr',
          '@payloadcms/translations > date-fns/locale/hu',
          '@payloadcms/translations > date-fns/locale/id',
          '@payloadcms/translations > date-fns/locale/is',
          '@payloadcms/translations > date-fns/locale/it',
          '@payloadcms/translations > date-fns/locale/ja',
          '@payloadcms/translations > date-fns/locale/ko',
          '@payloadcms/translations > date-fns/locale/lt',
          '@payloadcms/translations > date-fns/locale/lv',
          '@payloadcms/translations > date-fns/locale/nb',
          '@payloadcms/translations > date-fns/locale/nl',
          '@payloadcms/translations > date-fns/locale/pl',
          '@payloadcms/translations > date-fns/locale/pt',
          '@payloadcms/translations > date-fns/locale/ro',
          '@payloadcms/translations > date-fns/locale/ru',
          '@payloadcms/translations > date-fns/locale/sk',
          '@payloadcms/translations > date-fns/locale/sl',
          '@payloadcms/translations > date-fns/locale/sr',
          '@payloadcms/translations > date-fns/locale/sr-Latn',
          '@payloadcms/translations > date-fns/locale/sv',
          '@payloadcms/translations > date-fns/locale/ta',
          '@payloadcms/translations > date-fns/locale/th',
          '@payloadcms/translations > date-fns/locale/tr',
          '@payloadcms/translations > date-fns/locale/uk',
          '@payloadcms/translations > date-fns/locale/vi',
          '@payloadcms/translations > date-fns/locale/zh-CN',
          '@payloadcms/translations > date-fns/locale/zh-TW',
          ...additionalOptimizeDepsInclude,
        ],
      },
      plugins: [
        ssrStripDistStyleImports(),
        isServe && schedulerESMShim(),
        isServe && rewriteClientCJSImports(),
        safeSSRConsole(),
        replaceProcessCwd(),
        tanstackVirtualModuleFallback(),
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
            },
          },
          router: {
            autoCodeSplitting: true,
            routesDirectory,
          } as any,
          srcDirectory,
        }),
        viteReact({
          exclude: [],
          include: /\.[jt]sx?$/,
        }),
        injectViteDevScripts(),
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
        dedupe: ['react', 'react-dom', '@payloadcms/ui'],
        tsconfigPaths: true,
      } as any,
      server: {
        port,
        strictPort: true,
        ...(warmupClientFiles ? { warmup: { clientFiles: warmupClientFiles } } : {}),
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
          ...additionalSsrExternal,
        ],
        noExternal: [/^@payloadcms\//, 'payload'],
      },
    }
  }
}
