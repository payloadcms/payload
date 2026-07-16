import { withPayload } from '@payloadcms/tanstack-start/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// This config drives the TanStack admin app from the `test` package, mirroring
// how the Next.js test apps live under `test/`. Its dependencies are declared by
// `test/package.json` and resolve from `test/node_modules`, so the root
// `package.json` stays clean and the shippable `app-tanstack` (a pristine source
// copy at the repo root) needs no `package.json`/`node_modules` of its own.
//
// Vite's root is `test/` (it runs with `cwd` there): `@vitejs/plugin-rsc`
// hardcodes its temp dir to `<root>/node_modules/.vite-rsc-temp`, so keeping the
// root at `test/` lands generated junk in `test/node_modules` (ignored) rather
// than in any `app-tanstack` dir. Build output is redirected to `dist/app-tanstack`
// at the repo root. The app is located via `srcDirectory`.
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const repoRoot = path.resolve(__dirname, '..')

const databaseAdapterPath = path.resolve(__dirname, 'databaseAdapter.js')
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
// rest fall back to the base test app at `test/app-tanstack`.
//
// `srcDirectory` is relative to the Vite root (`test/`): TanStack's entry
// planner joins it onto the root (`path.join`), so an absolute path would be
// concatenated rather than replace it.
const suiteDir = path.resolve(__dirname, testSuite, 'app-tanstack')
const srcDirectory = fs.existsSync(suiteDir) ? path.relative(__dirname, suiteDir) : 'app-tanstack'

export default withPayload(
  ({ pluginOptions }) => ({
    plugins: [
      rsc(pluginOptions.rsc),
      tanstackStart(pluginOptions.tanstackStart),
      viteReact(pluginOptions.react),
    ],
    // Keep build output out of the app dirs (they ship as pure source); the
    // repo root already ignores `dist`.
    build: { outDir: path.resolve(repoRoot, 'dist/app-tanstack') },
    optimizeDeps: {
      include: [
        // `recharts` is only reached through the dashboard suite's Revenue
        // widget, which is rendered on-demand via the `render-widget` server
        // function. Vite discovers it (and its d3-* subdeps) *after* the
        // initial crawl, forcing a full dep re-optimization + page reload
        // mid-test. That reload remounts the admin view and silently drops
        // client state (e.g. the dashboard's `isEditing`/unsaved layout),
        // flaking the add/delete/reset widget tests. Pre-bundle it so the
        // first optimization pass is complete.
        'recharts',
        // `@payloadcms/storage-vercel-blob`'s client upload handler imports
        // `upload` from `@vercel/blob/client`, which depends on the CommonJS
        // `async-retry`. Because the storage adapter is `noExternal` (bundled
        // from source), Vite's optimizer never crawls into it to discover
        // `@vercel/blob/client`, so it ships raw — and `async-retry`'s bare
        // `require()` throws "require() is not available in the browser
        // bundle", breaking the upload field (file input never mounts).
        // Pre-bundling lets esbuild convert the CJS require to ESM.
        '@vercel/blob/client',
      ],
    },
    envDir: repoRoot,
    server: {
      fs: { allow: [repoRoot] },
      port,
      strictPort: true,
      warmup: {
        clientFiles: [
          './app-tanstack/app/__root.tsx',
          './app-tanstack/app/_payload.tsx',
          './app-tanstack/app/_payload/admin.index.tsx',
          './app-tanstack/app/_payload/admin.$.tsx',
        ],
      },
    },
  }),
  {
    additionalIgnoreImporters: [
      /^\.\.\/packages\/tanstack-start\/src\/views\/AdminView\.tsx(?:\?.*)?$/,
    ],
    // In the monorepo, Payload's `.client.*` files resolve to `packages/*/src`
    // (not `node_modules`), so exempt them from the `.client.*` SSR denial too.
    clientDenialExcludeFiles: ['**/packages/*/src/**'],
    payloadConfigPath: path.resolve(__dirname, testSuite, 'config.ts'),
    routesDirectory: 'app',
    srcDirectory,
  },
)
