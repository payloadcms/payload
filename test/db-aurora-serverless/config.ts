import { auroraServerlessAdapter } from '@payloadcms/db-aurora-serverless'
import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { ensureAuroraResources } from './auroraSetup.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { database, endpoint, region, resourceArn, secretArn } = await ensureAuroraResources()

export default await buildConfigWithDefaults({
  suite: 'db-aurora-serverless',
  config: {
    db: auroraServerlessAdapter({
      connection: {
        credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
        database,
        endpoint,
        region,
        resourceArn,
        secretArn,
      },
      migrationDir: path.resolve(dirname, 'migrations'),
      // The RDS Data API binds Drizzle's `numeric(..., { mode: 'number' })` values as string
      // parameters without a DECIMAL type hint, which floci rejects. Map the migration bookkeeping
      // column to integer so the dev schema push can record its marker. See README.md.
      beforeSchemaInit: [
        ({ adapter }) => {
          const migrationsTable = adapter.rawTables.payload_migrations
          const batchColumn = migrationsTable?.columns.batch

          if (migrationsTable && batchColumn) {
            migrationsTable.columns.batch = { name: batchColumn.name, type: 'integer' }
          }

          return { enums: adapter.enums, relations: adapter.relations, tables: adapter.tables }
        },
      ],
    }),
    collections: [
      {
        slug: 'categories',
        fields: [
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'posts',
            type: 'join',
            collection: 'posts',
            on: 'categories',
          },
        ],
      },
      {
        slug: 'posts',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'tags',
            type: 'array',
            fields: [
              {
                name: 'label',
                type: 'text',
              },
            ],
          },
          {
            name: 'categories',
            type: 'relationship',
            hasMany: true,
            relationTo: 'categories',
          },
          {
            name: 'primaryCategory',
            type: 'relationship',
            relationTo: 'categories',
          },
        ],
        hooks: {
          beforeChange: [
            ({ data }) => {
              if (data?.title === 'trigger-transaction-error') {
                throw new Error('Intentional failure for transaction rollback test')
              }

              return data
            },
          ],
        },
      },
    ],
  },
})
