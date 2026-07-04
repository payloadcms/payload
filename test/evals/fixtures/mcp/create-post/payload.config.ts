/* eslint-disable no-restricted-exports */

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { buildConfig } from 'payload'

const databaseURL = new URL(
  process.env.MONGODB_URL ||
    process.env.DATABASE_URL ||
    'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0',
)

databaseURL.pathname = '/payload-eval-mcp'

export default buildConfig({
  collections: [
    {
      slug: 'posts',
      fields: [{ name: 'title', type: 'text', required: true }],
    },
  ],
  db: mongooseAdapter({ url: databaseURL.toString() }),
  plugins: [mcpPlugin({ collections: { posts: {} } })],
  secret: 'payload-eval-mcp',
})
