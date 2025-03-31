/* eslint-disable jest/require-top-level-describe */
import type { PostgresAdapter } from '@payloadcms/db-postgres/types'

import { cosineDistance, desc, gt, sql } from 'drizzle-orm'
import path from 'path'
import { buildConfig, getPayload } from 'payload'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// skip on ci as there db does not have the vector extension
const describeToUse =
  process.env.PAYLOAD_DATABASE.startsWith('postgres') && process.env.CI !== 'true'
    ? describe
    : describe.skip

describeToUse('postgres vector custom column', () => {
  it('should add a vector column and query it', async () => {
    const { databaseAdapter } = await import(path.resolve(dirname, '../databaseAdapter.js'))

    const init = databaseAdapter.init

    // set options
    databaseAdapter.init = ({ payload }) => {
      const adapter = init({ payload })

      adapter.extensions = {
        vector: true,
      }
      adapter.beforeSchemaInit = [
        ({ schema, adapter }) => {
          ;(adapter as PostgresAdapter).rawTables.posts.columns.embedding = {
            type: 'vector',
            dimensions: 5,
            name: 'embedding',
          }
          return schema
        },
      ]
      return adapter
    }

    const config = await buildConfig({
      db: databaseAdapter,
      secret: 'secret',
      collections: [
        {
          slug: 'users',
          auth: true,
          fields: [],
        },
        {
          slug: 'posts',
          fields: [
            {
              type: 'json',
              name: 'embedding',
            },
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
      ],
    })

    const payload = await getPayload({ config })

    const catEmbedding = [1.5, -0.4, 7.2, 19.6, 20.2]

    await payload.create({
      collection: 'posts',
      data: {
        embedding: [-5.2, 3.1, 0.2, 8.1, 3.5],
        title: 'apple',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        embedding: catEmbedding,
        title: 'cat',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        embedding: [-5.1, 2.9, 0.8, 7.9, 3.1],
        title: 'fruit',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        embedding: [1.7, -0.3, 6.9, 19.1, 21.1],
        title: 'dog',
      },
    })

    const similarity = sql<number>`1 - (${cosineDistance(payload.db.tables.posts.embedding, catEmbedding)})`

    const res = await payload.db.drizzle
      .select()
      .from(payload.db.tables.posts)
      .where(gt(similarity, 0.9))
      .orderBy(desc(similarity))

    // Only cat and dog
    expect(res).toHaveLength(2)

    // similarity sort
    expect(res[0].title).toBe('cat')
    expect(res[1].title).toBe('dog')

    payload.logger.info(res)
  })
})
