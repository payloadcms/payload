import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { Payload } from 'payload'

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
    // Fixture writes must target the primary when the adapter has read replicas.
    const drizzle = db.primaryDrizzle ?? db.drizzle

    // Preserve the schema so cached snapshots can be restored without rebuilding tables or indexes.
    const tableNames = Object.keys(db.tables)
    if (!tableNames.length) {
      return
    }

    const schemaPrefix = db.schemaName ? `"${db.schemaName.replaceAll('"', '""')}".` : ''
    const tableReferences = tableNames.map((tableName) => {
      const escapedTableName = tableName.replaceAll('"', '""')

      return `${schemaPrefix}"${escapedTableName}"`
    })

    if (db.name === 'postgres') {
      await db.execute({
        drizzle,
        raw: `TRUNCATE TABLE ${tableReferences.join(',')} CONTINUE IDENTITY CASCADE;`,
      })
    } else {
      await db.execute({ drizzle, raw: 'PRAGMA foreign_keys = off' })

      try {
        for (const tableReference of tableReferences) {
          await db.execute({ drizzle, raw: `DELETE FROM ${tableReference};` })
        }
      } finally {
        await db.execute({ drizzle, raw: 'PRAGMA foreign_keys = on' })
      }
    }

    if (db.primaryDrizzle) {
      // Keep subsequent test reads on the primary until the replica catches up.
      db.lastWriteTimestamp = Date.now()
    }
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
