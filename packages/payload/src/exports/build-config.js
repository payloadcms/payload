/**
 * Server-only Payload packages that can skip development transforms.
 * Packages with client components loaded by the import map must remain bundled.
 * Production bundling preserves tree-shaking and avoids duplicate dependencies.
 */
export const devServerExternalPackages = [
  'payload',
  '@payloadcms/db-mongodb',
  '@payloadcms/db-postgres',
  '@payloadcms/db-sqlite',
  '@payloadcms/db-vercel-postgres',
  '@payloadcms/db-d1-sqlite',
  '@payloadcms/drizzle',
  '@payloadcms/email-nodemailer',
  '@payloadcms/email-resend',
  '@payloadcms/graphql',
  '@payloadcms/kv-redis',
  '@payloadcms/payload-cloud',
  // Its `/client` entry has no exports, so the import map never loads anything from it.
  '@payloadcms/plugin-mcp',
  '@payloadcms/plugin-nested-docs',
  '@payloadcms/plugin-redirects',
  '@payloadcms/transformer-sharp',
  '@payloadcms/translations',
]

/** Third-party packages that both framework adapters externalize in development and production. */
export const serverExternalPackages = [
  // GraphQL requires a single runtime instance across bundled and external packages.
  'graphql',
  'drizzle-kit',
  'drizzle-kit/api',
  'sharp',
  'libsql',
  'require-in-the-middle',
  'json-schema-to-typescript',
  // Bundling pino's thread-stream dependency causes Turbopack build errors.
  'pino',
]
