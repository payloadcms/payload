import { payloadPlugin } from '@payloadcms/tanstack-start/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLogger, defineConfig, mergeConfig } from 'vite'

// This config lives at the monorepo root (not inside `app-tanstack`) so the
// TanStack app can ship as plain source — no `package.json`, no `node_modules`.
// Its dependencies are declared by the root `package.json` and resolve from the
// root `node_modules`. Run it with Vite's root set to `app-tanstack` (the dev
// server spawns vite with `cwd: app-tanstack`; the `build:app-tanstack` script
// passes `--root app-tanstack`), so `srcDirectory`/`outDir`/warmup stay
// app-relative even though the config file sits up here.
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const appRoot = path.resolve(__dirname, 'app-tanstack')

// Third-party deps (react-datepicker, @faceless-ui/*) ship sourcemaps whose
// original source files aren't published, so Vite warns on every one. Silence
// just those warnings to keep dev startup output readable.
const logger = createLogger()
const isMissingSourcemapWarning = (msg: string) => msg.includes('points to missing source files')
const baseWarn = logger.warn.bind(logger)
const baseWarnOnce = logger.warnOnce.bind(logger)
logger.warn = (msg, options) => {
  if (isMissingSourcemapWarning(msg)) {
    return
  }
  baseWarn(msg, options)
}
logger.warnOnce = (msg, options) => {
  if (isMissingSourcemapWarning(msg)) {
    return
  }
  baseWarnOnce(msg, options)
}

const databaseAdapterPath = path.resolve(__dirname, 'test', 'databaseAdapter.js')
if (!fs.existsSync(databaseAdapterPath)) {
  fs.writeFileSync(
    databaseAdapterPath,
    `// Auto-generated fallback for CI builds — overwritten by test harness at runtime
import { mongooseAdapter } from '@payloadcms/db-mongodb'
export const databaseAdapter = mongooseAdapter({
  ensureIndexes: true,
  url: process.env.MONGODB_URL || process.env.DATABASE_URL ||
    'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0',
})
`,
  )
}

const port = Number(process.env.PORT) || 3000

const testSuite = process.env.PAYLOAD_TEST_SUITE || '_community'

// Each test suite that ships its own TanStack app
// (`test/<suite>/app-tanstack`) is a completely standalone app — its own
// `router.tsx`, routes, `importMap.js`, components and `routeTree.gen.ts`. We
// point `srcDirectory` at that suite dir so everything resolves within it; the
// rest fall back to the shippable app at `app-tanstack`. Mirrors how each Next
// test suite owns its own `rootDir`/`app` dir.
//
// `srcDirectory` is relative to the Vite root (`app-tanstack`): TanStack's
// entry planner joins it onto the root (`path.join`), so an absolute path would
// be concatenated rather than replace it.
const suiteDir = path.resolve(__dirname, 'test', testSuite, 'app-tanstack')
const srcDirectory = fs.existsSync(suiteDir) ? path.relative(appRoot, suiteDir) : '.'

export default defineConfig((env) =>
  mergeConfig(
    payloadPlugin({
      additionalIgnoreImporters: [
        /^\.\.\/packages\/tanstack-start\/src\/views\/AdminView\.tsx(?:\?.*)?$/,
      ],
      payloadConfigPath: path.resolve(__dirname, 'test', testSuite, 'config.ts'),
      reactPlugin: viteReact({
        exclude: [],
        include: /\.[jt]sx?$/,
      }),
      routesDirectory: 'app',
      rscPlugin: rsc({ serverHandler: false }),
      srcDirectory,
      tanstackStart,
    })(env),
    {
      css: {
        preprocessorOptions: {
          scss: {
            importers: [
              {
                findFileUrl(url: string) {
                  if (url.startsWith('~@payloadcms/ui/scss')) {
                    return new URL(
                      'file://' + path.resolve(__dirname, 'packages/ui/src/scss/styles.scss'),
                    )
                  }
                  return null
                },
              },
            ],
          },
        },
      },
      customLogger: logger,
      envDir: __dirname,
      server: {
        // Suite route dirs live under `test/<suite>/app-tanstack`, outside the
        // Vite root, so allow Vite to serve from the monorepo root.
        fs: { allow: [__dirname] },
        port,
        strictPort: true,
        warmup: {
          clientFiles: [
            './app/__root.tsx',
            './app/_payload.tsx',
            './app/_payload/admin.index.tsx',
            './app/_payload/admin.$.tsx',
          ],
        },
      },
    },
  ),
)
