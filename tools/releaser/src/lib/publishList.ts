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
  'db-vercel-postgres',

  // Adapters
  'email-nodemailer',
  'email-resend',

  // Storage
  'storage-s3',
  'storage-azure',
  'storage-gcs',
  'storage-vercel-blob',
  'storage-uploadthing',

  // Plugins
  'payload-cloud',
  'plugin-cloud',
  'plugin-cloud-storage',
  'plugin-form-builder',
  'plugin-import-export',
  'plugin-multi-tenant',
  'plugin-nested-docs',
  'plugin-redirects',
  'plugin-search',
  'plugin-sentry',
  'plugin-seo',
  'plugin-stripe',

  // Unpublished
  // 'storage-uploadthing',
  // 'eslint-config',
  // 'eslint-plugin',
  // 'live-preview-vue',
]
