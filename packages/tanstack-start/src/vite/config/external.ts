/**
 * SSR/RSC externalization config used by `withPayload`. Kept separate from the
 * client optimizer config (`./optimizeDeps.ts`) so each concern stays small.
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
  'require-in-the-middle',
  'json-schema-to-typescript',
  'pino',
  'pino-pretty',
  'graphql',
  'nodemailer',
  'aws4',
  'pluralize',
  'console-table-printer',
  '@azure/storage-blob',
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  '@google-cloud/storage',
  // Database drivers + their lazily-required companions, one group per adapter.
  // Postgres (`@payloadcms/db-postgres`, `@payloadcms/db-vercel-postgres`)
  'pg',
  'pg-native',
  'pg-cloudflare',
  // SQLite (`@payloadcms/db-sqlite`)
  'better-sqlite3',
  'libsql',
  // Mongo (`@payloadcms/db-mongodb`)
  'mongodb',
  'mongoose',
]

/**
 * External packages for the production `vite build` only (not dev serve).
 *
 * Externalizes the `@payloadcms/*` package boundaries — plus `payload` — so each
 * resolves its own transitive Node deps (`pino`, `drizzle-orm`, `libsql`, …) from
 * its own `node_modules` at runtime. Externalizing only the leaf deps breaks under
 * pnpm: a leaf imported by bundled code becomes an unresolvable bare specifier from
 * `dist/`, since pnpm does not hoist it.
 *
 * Kept out of dev's `ssr.external` on purpose: the monorepo resolves these to
 * TypeScript source (`.ts` imported via `.js` specifiers), which only Vite's
 * transform can resolve — an externalized copy would hit Node's raw resolver and
 * fail on the `.js`→`.ts` mismatch.
 */
export const buildExternalPackages: string[] = [
  'payload',
  'payload/node',
  '@payloadcms/drizzle',
  '@payloadcms/db-mongodb',
  '@payloadcms/db-postgres',
  '@payloadcms/db-vercel-postgres',
  '@payloadcms/db-sqlite',
  '@payloadcms/db-d1-sqlite',
  ...ssrExternalPackages,
]

export const payloadNoExternalPatterns: Array<RegExp | string> = [
  '@payloadcms/ui',
  '@payloadcms/translations',
  '@payloadcms/tanstack-start',
  /^@payloadcms\/richtext-lexical/,
  /^@payloadcms\/plugin-/,
  /^@payloadcms\/storage-/,
]
