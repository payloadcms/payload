/**
 * Vite-level configuration constants used by `payloadPlugin`. Kept separate so
 * `plugin.ts` stays focused on wiring.
 */

/**
 * Server-only packages (Node-only or only ever used by the server bundle). These
 * are the Vite equivalent of Next.js's `serverExternalPackages`.
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
 * Vite auto-discovers most `@payloadcms/ui` transitive deps now that
 * `@payloadcms/ui` itself is no longer in `optimizeDeps.exclude`. `scheduler`
 * stays explicit because it is a React-internal that the discovery walk does
 * not always pick up.
 */
export const optimizeDepsIncludeDefaults: string[] = ['scheduler']

export const optimizeDepsExcludeDefaults: string[] = [
  'sharp',
  'pino',
  'pino-pretty',
  'busboy',
  'get-tsconfig',
  'ws',
  'croner',
  'prompts',
  'file-type',
]
