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

export const payloadNoExternalPatterns: Array<RegExp | string> = [
  '@payloadcms/ui',
  '@payloadcms/translations',
  '@payloadcms/tanstack-start',
  /^@payloadcms\/richtext-lexical/,
  /^@payloadcms\/plugin-/,
  /^@payloadcms\/storage-/,
]
