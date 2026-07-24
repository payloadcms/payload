import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { Payload } from 'payload'

import { getTableName } from 'drizzle-orm'

import { isMongoose } from '../isMongoose.js'

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
    const tables = db.tables
    if (!tables) {
      return
    }

    const queries = Object.values(tables)
      .map((table) => {
        return `DELETE FROM ${db.schemaName ? db.schemaName + '.' : ''}${getTableName(table)};`
      })
      .join('')

    await db.execute({
      drizzle: db.drizzle,
      raw: queries,
    })
  } else if (
    'clearDatabase' in _payload.db &&
    typeof (_payload.db as any).clearDatabase === 'function'
  ) {
    console.log('[resetDB] using clearDatabase method')
    await (_payload.db as any).clearDatabase()
  } else {
    // Fallback for other unknown adapters
    console.warn(
      '[resetDB] No reset method available for this adapter. Database will not be cleared.',
    )
  }
}
