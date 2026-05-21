/**
 * Vite-level configuration constants used by `payloadPlugin`. Kept separate so
 * `plugin.ts` stays focused on wiring.
 */

/**
 * Server-only packages (Node-only or only ever used by the server bundle).
 * These are the Vite equivalent of Next.js's `serverExternalPackages`.
 */
export const ssrExternalPackages: string[] = [
  'ajv',
  'fast-uri',
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
  '@azure/storage-blob',
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  '@google-cloud/storage',
]

/**
 * Payload packages whose source must be processed by Vite even on the server
 * (because they are workspace `.ts` files in dev). Server-only adapters
 * (`@payloadcms/db-*`, `@payloadcms/email-*`, `@payloadcms/next`, etc.) are
 * intentionally not included — those should stay external on the SSR side.
 */
export const payloadNoExternalPatterns: Array<RegExp | string> = [
  '@payloadcms/ui',
  '@payloadcms/translations',
  '@payloadcms/tanstack-start',
  /^@payloadcms\/richtext-lexical/,
  /^@payloadcms\/plugin-/,
  /^@payloadcms\/storage-/,
]

/**
 * The subset of `payloadNoExternalPatterns` that needs to participate in the
 * RSC environment. The RSC graph is narrower — plugins and storage adapters
 * don't run in RSC, only the admin UI surface does.
 */
export const payloadRscNoExternalPatterns: Array<RegExp | string> = [
  '@payloadcms/ui',
  '@payloadcms/translations',
  '@payloadcms/tanstack-start',
  /^@payloadcms\/richtext-lexical/,
]

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
  'scheduler',
]
