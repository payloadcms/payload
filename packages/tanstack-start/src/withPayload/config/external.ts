import {
  devServerExternalPackages as devServerExternalPayloadPackages,
  serverExternalPackages as serverExternalPayloadPackages,
} from 'payload/build-config'

/**
 * Packages externalized during dev serve (`ssr.external`). Node's loader resolves
 * their CJS/UMD directly; letting Vite's dev SSR transform touch them can break
 * fragile UMD wrappers (e.g. `pluralize`, whose `this`-based global assignment
 * throws when transformed rather than required).
 *
 * Safe here whoever declared the entry: Node resolves from the importing package,
 * so pnpm's isolated layout never applies. The build is stricter — see
 * {@link buildBundledPackages}.
 */
export const ssrExternalPackages: string[] = [
  'zod',
  'fast-uri',
  ...serverExternalPayloadPackages,
  'drizzle-orm',
  'pino-pretty',
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
  // Mongo (`@payloadcms/db-mongodb`)
  'mongodb',
  'mongoose',
]

/**
 * Entries of {@link ssrExternalPackages} that must bundle in the production build.
 *
 * Externalizing only works for specifiers resolvable from the project root. These
 * are leaf deps of Payload packages, so under pnpm they live in `.pnpm/…` and a bare
 * specifier in a root-resolved chunk is invisible — `ERR_MODULE_NOT_FOUND` at
 * runtime, or a build-time resolve failure under Nitro's re-bundle pass.
 *
 * `pluralize` also needs forcing back via `noExternal` (see `withPayload`); the
 * storage leaves don't, since their adapters are already `noExternal`.
 */
export const buildBundledPackages: string[] = [
  'pluralize',
  // Leaf deps of the `@payloadcms/storage-*` adapters.
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  '@azure/storage-blob',
  '@google-cloud/storage',
]

/** Server-only package boundaries loaded directly by Node in development and production. */
export const serverExternalPackages: string[] = [
  'payload',
  'payload/node',
  '@payloadcms/drizzle',
  '@payloadcms/db-mongodb',
  '@payloadcms/db-postgres',
  '@payloadcms/db-vercel-postgres',
  '@payloadcms/db-sqlite',
  '@payloadcms/db-d1-sqlite',
]

/** Additional installed packages that can bypass Vite's development server transforms. */
export const devExternalPackages: string[] = [
  ...new Set([
    // Vite otherwise transforms date-fns' full module graph during SSR.
    'date-fns',
    ...devServerExternalPayloadPackages,
    ...serverExternalPackages,
  ]),
]

/**
 * Externalizes package boundaries so packages resolve their own transitive dependencies under pnpm.
 * Leaves that must bundle in production are excluded; see {@link buildBundledPackages}.
 */
export const buildExternalPackages: string[] = [
  ...serverExternalPackages,
  ...ssrExternalPackages.filter((pkg) => !buildBundledPackages.includes(pkg)),
]

export const payloadNoExternalPatterns: Array<RegExp | string> = [
  '@payloadcms/ui',
  '@payloadcms/translations',
  '@payloadcms/tanstack-start',
  /^@payloadcms\/richtext-lexical/,
  /^@payloadcms\/plugin-/,
  /^@payloadcms\/storage-/,
]
