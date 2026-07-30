/**
 * Client dep-optimizer config used by `withPayload`. Kept separate from the
 * SSR/RSC externalization config (`./external.ts`) so each concern stays small.
 */

/**
 * Packages we know contain Node-only code or top-level side effects requiring
 * Node APIs. Excluding them from the client optimizer prevents Vite from
 * walking into their main entries and trying to bundle server-only imports
 * for the browser.
 */
export const optimizeDepsExcludeDefaults: string[] = [
  'sharp',
  '@payloadcms/ui',
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
  // Server-only SDKs used by `@payloadcms/storage-*` adapters. Vite
  // sometimes walks these from the main package entry while scanning
  // workspace deps, and the browser sub-bundles do not expose the
  // server-only APIs (e.g. `BlobSASPermissions`), which crashes the dev
  // server with a `MISSING_EXPORT` error before any test runs.
  '@azure/storage-blob',
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  '@google-cloud/storage',
]

/**
 * Transitive dependencies of `@payloadcms/ui` and `payload` that need to be
 * pre-bundled for the client. Vite's auto-discovery doesn't reliably pick
 * these up because their parent packages are in `optimizeDeps.exclude`, so we
 * list them explicitly using the `parent > child` syntax.
 *
 * Each entry below fixes a specific late-discovery re-optimization: without it,
 * Vite discovers the dep *after* its initial crawl, forcing a full dep
 * re-optimization mid-session that 404s in-flight `.vite/deps/*` chunks and
 * remounts the admin (dropping client state). This is why the list can't simply
 * be deleted — it is the "complete first pass" for the admin's dep graph.
 */
export const optimizeDepsIncludeDefaults: string[] = [
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
  // `scheduler` is a transitive dep of `react-dom`, not a direct dependency of
  // the app, so a bare `'scheduler'` specifier fails to resolve from an isolated
  // install (`test/node_modules` built with `pnpm i --ignore-workspace`), where
  // it isn't hoisted to the top level. Path it through `react-dom` so the
  // optimizer resolves the exact copy the runtime loads.
  'react-dom > scheduler',
  // `@payloadcms/ui` (in `optimizeDeps.exclude`) ships compiled output that the
  // React Compiler rewrote to `import { c } from 'react/compiler-runtime'`.
  // Because its parent is excluded, the optimizer never crawls in to discover
  // this entry, so Vite serves `react/compiler-runtime` raw. That file is
  // CommonJS (`module.exports = require(...)`), so the named `c` export can't be
  // statically extracted and every client component throws "does not provide an
  // export named 'c'". Pre-bundling it lets esbuild synthesize the named export.
  'react/compiler-runtime',
  // Transitive deps that Vite otherwise discovers *after* the initial crawl
  // (react-select pulls in @floating-ui at runtime; react-is is reached via
  // react-transition-group/prop-types; the default date-fns locale is loaded
  // through a dynamic `date-fns/locale/${key}` import). A late discovery forces
  // a full dep re-optimization mid-session, which 404s every in-flight
  // `.vite/deps/*` chunk ("Pre-transform error: file does not exist in the
  // optimize deps directory") and breaks the admin UI in CI cold starts.
  // Pre-bundling them keeps the first optimization pass complete.
  '@payloadcms/ui > react-select > @floating-ui/dom',
  '@payloadcms/ui > react-select > @floating-ui/dom > @floating-ui/core',
  '@payloadcms/ui > react-select > prop-types > react-is',
  '@payloadcms/ui > date-fns/locale/en-US',
  // Further late discoveries observed re-optimizing mid-run in CI cold starts
  // (see CI logs: "✨ new dependencies optimized: @dnd-kit/modifiers / ajv /
  // dequal/lite"). The modular dashboard pulls in `@dnd-kit/modifiers` on first
  // render; form-state diffing reaches `dequal/lite` (a distinct entry point
  // from the already-listed `dequal`); client-side field validation reaches
  // `ajv` *through `payload`* — it is `ssrExternal` server-side but still
  // bundled into the client, and must be pathed via `payload` so the optimizer
  // pre-bundles the exact copy the runtime loads.
  '@payloadcms/ui > @dnd-kit/modifiers',
  '@payloadcms/ui > dequal/lite',
  'payload > ajv',
  // The storage client-upload suites (esp. vercel-blob) crawl part of the
  // `payload` server runtime into the client bundle and discover these late,
  // triggering several "optimized dependencies changed. reloading" waves that
  // reload the page mid-test (the bulk-upload drawer's Create New button /
  // dropzone vanish and the direct-to-bucket PUT never fires). Pre-bundle the
  // whole observed set so the first pass is complete.
  'payload > undici',
  'payload > jose',
  'payload > dataloader',
  'payload > path-to-regexp',
  'payload > console-table-printer',
  'payload > ci-info',
  'payload > image-size',
  'payload > image-size/fromFile',
  'payload > ipaddr.js',
  'payload > range-parser',
  'payload > sanitize-filename',
]
