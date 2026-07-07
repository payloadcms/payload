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
 *
 * The same set is applied to BOTH the `ssr` and `rsc` environments. Plugins and
 * storage adapters must be included in RSC too: they register custom
 * providers/components (e.g. `plugin-multi-tenant`'s `'use client'`
 * `TenantSelectionProvider`) that render in the RSC graph via
 * `RenderServerComponent`. If the package stayed external to RSC, `plugin-rsc`
 * would never transform its `'use client'` modules into client references, so
 * the component would execute server-side and crash on the first hook
 * (`Cannot read properties of null (reading 'useState')`).
 */
export const payloadNoExternalPatterns: Array<RegExp | string> = [
  '@payloadcms/ui',
  '@payloadcms/translations',
  '@payloadcms/tanstack-start',
  /^@payloadcms\/richtext-lexical/,
  /^@payloadcms\/plugin-/,
  /^@payloadcms\/storage-/,
]
