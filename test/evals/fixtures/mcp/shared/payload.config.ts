import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { AUDIT_LOG_PATH_ENV, auditPlugin } from '../../../../__helpers/plugins/audit/index.js'

const auditPath = process.env[AUDIT_LOG_PATH_ENV]
const databaseURL = process.env.PAYLOAD_MCP_EVAL_DATABASE_URL

if (!databaseURL) {
  throw new Error('PAYLOAD_MCP_EVAL_DATABASE_URL is required for MCP evals')
}

export default buildConfig({
  collections: [
    {
      slug: 'authors',
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      slug: 'posts',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'author', type: 'relationship', relationTo: 'authors' },
        { name: 'content', type: 'richText' },
      ],
    },
    {
      slug: 'articles',
      fields: [{ name: 'title', type: 'text', localized: true, required: true }],
      versions: { drafts: true },
    },
  ],
  db: sqliteAdapter({
    busyTimeout: 5000,
    client: { url: databaseURL },
    wal: true,
  }),
  editor: lexicalEditor({}),
  globals: [
    {
      slug: 'site-settings',
      fields: [{ name: 'tagline', type: 'text', defaultValue: 'Original tagline' }],
    },
  ],
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'es'],
  },
  plugins: [
    mcpPlugin({
      collections: {
        articles: {},
        authors: {},
        posts: {},
      },
      globals: {
        'site-settings': {},
      },
    }),
    auditPlugin({
      beforeOperation: ({ slug, entityType, operation, payloadAPI }) => {
        if (payloadAPI !== 'MCP') {
          throw new Error(
            `MCP eval blocked ${payloadAPI} ${operation} operation on ${entityType} "${slug}"`,
          )
        }
      },
      path: auditPath,
    }),
  ],
  secret: 'payload-eval-mcp',
})
