/**
 * Packages that should be published to NPM, in topological order
 * (every dependency precedes its dependents).
 *
 * Note that this does not include all packages in the monorepo.
 * Verified by publishList.spec.ts.
 */
export const packagePublishList = [
  // Foundation
  'translations',
  'payload',

  // Core UI/API
  'ui',
  'graphql',
  'next',
  'richtext-lexical',
  'tanstack-start',

  // DB
  'drizzle',
  'db-mongodb',
  'db-postgres',
  'db-sqlite',
  'db-d1-sqlite',
  'db-vercel-postgres',

  // Email -> cloud
  'email-nodemailer',
  'email-resend',
  'payload-cloud',

  // Storage
  'plugin-cloud-storage',
  'storage-s3',
  'storage-r2',
  'storage-azure',
  'storage-gcs',
  'storage-vercel-blob',

  // Live preview
  'live-preview',
  'live-preview-react',
  'live-preview-vue',

  // Plugins
  'plugin-ecommerce',
  'plugin-form-builder',
  'plugin-import-export',
  'plugin-mcp',
  'plugin-multi-tenant',
  'plugin-nested-docs',
  'plugin-redirects',
  'plugin-search',
  'plugin-sentry',
  'plugin-seo',
  'plugin-stripe',

  // Leaves
  'sdk',
  'kv-redis',
  'admin-bar',

  // Standalone
  'create-payload-app',
  'typescript-plugin',
  'codemod',
]
