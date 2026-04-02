/**
 * Packages that should be published to NPM
 *
 * Note that this does not include all packages in the monorepo
 */
export const packagePublishList = [
  'payload',
  'translations',
  'ui',
  'next',
  'graphql',
  'admin-bar',
  'live-preview',
  'live-preview-react',
  'live-preview-vue',
  'richtext-slate',
  'richtext-lexical',

  'create-payload-app',

  // DB Adapters
  'drizzle',
  'db-mongodb',
  'db-postgres',
  'db-sqlite',
  'db-d1-sqlite',
  'db-vercel-postgres',

  // Adapters
  'email-nodemailer',
  'email-resend',

  // SDK
  'sdk',

  // Storage
  'storage-s3',
  'storage-r2',
  'storage-azure',
  'storage-gcs',
  'storage-vercel-blob',
  'storage-uploadthing',

  // KV
  'kv-redis',

  // Plugins
  'payload-cloud',
  'plugin-cloud-storage',
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

  'typescript-plugin',

  // Unpublished
  // 'storage-uploadthing',
  // 'eslint-config',
  // 'eslint-plugin',
  // 'live-preview-vue',
]
