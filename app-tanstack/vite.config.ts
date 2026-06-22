import { payloadPlugin } from '@payloadcms/tanstack-start/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLogger, defineConfig, mergeConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

const databaseAdapterPath = path.resolve(__dirname, '..', 'test', 'databaseAdapter.js')
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

// Most test suites only exercise the shared admin shell, so they fall back to
// the shippable routes in `src/app`. A suite that needs extra front-end routes
// (e.g. `live-preview`, `admin-bar`) ships its own complete routes directory
// under `test/<suite>/app-tanstack/app`, keeping that test-only routing out of
// the shippable root. Mirrors how each Next test suite owns its own `app` dir.
// An absolute `routesDirectory` overrides the default `src/<dir>` resolution;
// `routeTree.gen.ts` is always emitted to `src/` regardless, so `router.tsx`
// stays shared.
const suiteRoutesDir = path.resolve(__dirname, '..', 'test', testSuite, 'app-tanstack', 'app')
const routesDirectory = fs.existsSync(suiteRoutesDir) ? suiteRoutesDir : 'app'

export default defineConfig((env) =>
  mergeConfig(
    payloadPlugin({
      // Resolve the `~` → `src` alias as an explicit Vite alias rather than
      // relying on `resolve.tsconfigPaths`. Per-suite route dirs (e.g.
      // `test/<suite>/app-tanstack/app`) live outside this project, so their
      // nearest tsconfig is not `app-tanstack/tsconfig.json` and tsconfck would never
      // apply the `~/*` mapping to them. A Vite alias applies globally, so the
      // duplicated shell route files resolve shared modules the same wherever
      // they live.
      additionalAliases: [{ find: '~', replacement: path.resolve(__dirname, 'src') }],
      additionalIgnoreImporters: [
        /^\.\.\/packages\/tanstack-start\/src\/views\/AdminView\.tsx(?:\?.*)?$/,
      ],
      payloadConfigPath: path.resolve(__dirname, '..', 'test', testSuite, 'config.ts'),
      reactPlugin: viteReact({
        exclude: [],
        include: /\.[jt]sx?$/,
      }),
      routesDirectory,
      rscPlugin: rsc({ serverHandler: false }),
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
      customLogger: logger,
      envDir: path.resolve(__dirname, '..'),
      server: {
        // Per-suite route dirs live under `test/<suite>/app-tanstack`, outside
        // this app root, so allow Vite to serve from the monorepo root.
        fs: { allow: [path.resolve(__dirname, '..')] },
        port,
        strictPort: true,
        warmup: {
          clientFiles: [
            './src/app/__root.tsx',
            './src/app/_payload.tsx',
            './src/app/_payload/admin.index.tsx',
            './src/app/_payload/admin.$.tsx',
          ],
        },
      },
    },
  ),
)
