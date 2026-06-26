import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Payload config for D1 over HTTP (Cloudflare REST API).
 * Used by `int.spec.ts` when `CLOUDFLARE_*` env vars are set.
 */
export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'd1-http-posts',
      access: {
        create: () => true,
        delete: () => true,
        read: () => true,
        update: () => true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  db: sqliteD1Adapter({
    http: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID!,
    },
    push: true,
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
