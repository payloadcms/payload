import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { DatabaseAdapterObj } from 'payload'

import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const { databaseAdapter } = (await import(path.resolve(dirname, '../databaseAdapter.js'))) as {
  databaseAdapter: DatabaseAdapterObj<PostgresAdapter>
}

export default await buildConfig({
  db: databaseAdapter,
  secret: 'uuid-v7-test-secret',
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'posts',
      fields: [{ name: 'title', type: 'text' }],
    },
    {
      slug: 'categories',
      fields: [{ name: 'name', type: 'text' }],
    },
    {
      slug: 'articles',
      fields: [
        { name: 'title', type: 'text' },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
        },
      ],
    },
  ],
})
