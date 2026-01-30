import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { Payload } from 'payload'

import { isMongoose } from './isMongoose.js'

export async function resetDB(_payload: Payload, collectionSlugs: string[]) {
  if (isMongoose(_payload) && 'collections' in _payload.db && collectionSlugs.length > 0) {
    const firstCollectionSlug = collectionSlugs?.[0]

    if (!firstCollectionSlug?.length) {
      throw new Error('No collection slugs provided to reset the database.')
    }

    // Delete all documents from each collection instead of dropping the database.
    // This preserves indexes and is much faster for consecutive test runs.
    const mongooseCollections = _payload.db.collections[firstCollectionSlug]?.db.collections
    if (mongooseCollections) {
      await Promise.all(
        Object.values(mongooseCollections).map(async (collection: any) => {
          await collection.deleteMany({})
        }),
      )
    }
  } else if ('drizzle' in _payload.db) {
    const db = _payload.db as unknown as DrizzleAdapter

    // Alternative to: await db.drizzle.execute(sql`drop schema public cascade; create schema public;`)

    // Deleting the schema causes issues when restoring the database from a snapshot later on. That's why we only delete the table data here,
    // To avoid having to re-create any table schemas / indexes / whatever
    const schema = db.drizzle._.schema
    if (!schema) {
      return
    }

    // Execute DELETE statements sequentially for SQLite compatibility
    // SQLite doesn't support multiple statements in a single execute() call
    for (const table of Object.values(schema)) {
      const tableName = (table as any).dbName
      const query = `DELETE FROM ${db.schemaName ? db.schemaName + '.' : ''}${tableName};`
      await db.execute({
        drizzle: db.drizzle,
        raw: query,
      })
    }
  }
}
