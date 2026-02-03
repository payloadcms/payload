import type { Payload } from 'payload'

import { isMongoose } from './isMongoose.js'

type DrizzleDb = {
  drizzle: { _: { schema: Record<string, { dbName: string }> | undefined } }
  execute: (args: { drizzle: unknown; raw: string }) => Promise<unknown>
  schemaName?: string
}

export async function resetDB(_payload: Payload, collectionSlugs: string[]) {
  if (isMongoose(_payload) && 'collections' in _payload.db && collectionSlugs.length > 0) {
    const firstCollectionSlug = collectionSlugs?.[0]

    if (!firstCollectionSlug?.length) {
      throw new Error('No collection slugs provided to reset the database.')
    }

    // Delete all documents from each collection instead of dropping the database.
    // This preserves indexes and is much faster for consecutive test runs.
    const mongooseCollections = (_payload.db as any).collections[firstCollectionSlug]?.db
      .collections
    if (mongooseCollections) {
      await Promise.all(
        Object.values(mongooseCollections).map(async (collection: any) => {
          await collection.deleteMany({})
        }),
      )
    }
  } else if ('drizzle' in _payload.db) {
    const db = _payload.db as unknown as DrizzleDb

    // Alternative to: await db.drizzle.execute(sql`drop schema public cascade; create schema public;`)

    // Deleting the schema causes issues when restoring the database from a snapshot later on. That's why we only delete the table data here,
    // To avoid having to re-create any table schemas / indexes / whatever
    const schema = db.drizzle._.schema
    if (!schema) {
      return
    }

    const queries = Object.values(schema)
      .map((table: any) => {
        return `DELETE FROM ${db.schemaName ? db.schemaName + '.' : ''}${table.dbName};`
      })
      .join('')

    await db.execute({
      drizzle: db.drizzle,
      raw: queries,
    })
  }
}
