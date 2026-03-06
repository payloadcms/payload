import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { PostgresDB } from '@payloadcms/drizzle'

import { cosineDistance, desc, gt, jaccardDistance, l2Distance, lt, sql } from 'drizzle-orm'
import path from 'path'
import { BasePayload, buildConfig, type DatabaseAdapterObj } from 'payload'
import { fileURLToPath } from 'url'
import { describe, expect, it } from 'vitest'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describePostgres = process.env.PAYLOAD_DATABASE?.startsWith('postgres')
  ? describe
  : describe.skip

describePostgres('postgres vector custom column', () => {
  const vectorColumnQueryTest = async (vectorType: string) => {
    const {
      databaseAdapter,
    }: {
      databaseAdapter: DatabaseAdapterObj<PostgresAdapter>
    } = await import(path.resolve(dirname, '../databaseAdapter.js'))

    const init = databaseAdapter.init

    // set options
    databaseAdapter.init = ({ payload }) => {
      const adapter = init({ payload })

      adapter.extensions = {
        vector: true,
      }
      adapter.beforeSchemaInit = [
        ({ schema, adapter }) => {
          if (adapter?.rawTables?.posts?.columns) {
            adapter.rawTables.posts.columns.embedding = {
              type: vectorType,
              dimensions: 5,
              name: 'embedding',
            }
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

    // do not use getPayload to avoid caching and re-using payload instance from previous tests
    const payload = await new BasePayload().init({ config })

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

    const db = payload.db.drizzle as PostgresDB

    const res = await db
      .select()
      .from(payload.db.tables.posts)
      .where(gt(similarity, 0.9))
      .orderBy(desc(similarity))

    // Only cat and dog
    expect(res).toHaveLength(2)

    // similarity sort
    expect(res?.[0]?.title).toBe('cat')
    expect(res?.[1]?.title).toBe('dog')
  }

  it('should add a vector column and query it', async () => {
    await vectorColumnQueryTest('vector')
  })

  it('should add a halfvec column and query it', async () => {
    await vectorColumnQueryTest('halfvec')
  })

  it('should add a sparsevec column and query it', async () => {
    const {
      databaseAdapter,
    }: {
      databaseAdapter: DatabaseAdapterObj<PostgresAdapter>
    } = await import(path.resolve(dirname, '../databaseAdapter.js'))

    const init = databaseAdapter.init

    databaseAdapter.init = ({ payload }) => {
      const adapter = init({ payload })

      adapter.extensions = {
        vector: true,
      }

      adapter.beforeSchemaInit = [
        ({ schema, adapter }) => {
          if (adapter?.rawTables?.posts?.columns) {
            adapter.rawTables.posts.columns.embedding = {
              type: 'sparsevec',
              dimensions: 5,
              name: 'embedding',
            }
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
              name: 'embedding',
              type: 'text',
            },
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
      ],
    })

    const payload = await new BasePayload().init({ config })

    // sparse-vector format: '{index:value,...}/dims'
    const catEmbedding = '{1:1,3:2,5:3}/5'

    await payload.create({
      collection: 'posts',
      data: {
        embedding: '{2:1,4:2}/5',
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
        embedding: '{2:4,4:6}/5',
        title: 'fruit',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        embedding: '{1:1,3:2,5:2}/5',
        title: 'dog',
      },
    })

    const distance = sql<number>`(${l2Distance(payload.db.tables.posts.embedding, catEmbedding)})`

    const db = payload.db.drizzle as PostgresDB

    const res = await db
      .select()
      .from(payload.db.tables.posts)
      .where(lt(distance, 1.1))
      .orderBy(distance)
      .execute()

    // should return cat (distance 0) then dog
    expect(res).toHaveLength(2)
    expect(res?.[0]?.title).toBe('cat')
    expect(res?.[1]?.title).toBe('dog')
  })

  it('should add a binaryvec column and query it', async () => {
    const {
      databaseAdapter,
    }: {
      databaseAdapter: DatabaseAdapterObj<PostgresAdapter>
    } = await import(path.resolve(dirname, '../databaseAdapter.js'))

    const init = databaseAdapter.init

    // set options
    databaseAdapter.init = ({ payload }) => {
      const adapter = init({ payload })

      adapter.extensions = {
        vector: true,
      }
      adapter.beforeSchemaInit = [
        ({ schema, adapter }) => {
          if (adapter?.rawTables?.posts?.columns) {
            adapter.rawTables.posts.columns.embedding = {
              type: 'bit',
              dimensions: 5,
              name: 'embedding',
            }
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
              type: 'text',
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

    // do not use getPayload to avoid caching and re-using payload instance from previous tests
    const payload = await new BasePayload().init({ config })

    const catEmbedding = '10101'

    await payload.create({
      collection: 'posts',
      data: {
        embedding: '01010',
        title: 'apple',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        embedding: '10101',
        title: 'cat',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        embedding: '11111',
        title: 'fruit',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        embedding: '10100',
        title: 'dog',
      },
    })

    const similarity = sql<number>`1 - (${jaccardDistance(payload.db.tables.posts.embedding, catEmbedding)})`

    const db = payload.db.drizzle as PostgresDB

    const res = await db
      .select()
      .from(payload.db.tables.posts)
      .where(gt(similarity, 0.6))
      .orderBy(desc(similarity))

    // Only cat and dog
    expect(res).toHaveLength(2)

    // similarity sort
    expect(res?.[0]?.title).toBe('cat')
    expect(res?.[1]?.title).toBe('dog')
  })
})
