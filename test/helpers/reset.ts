import type { DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { Payload } from 'payload'

import { isMongoose } from './isMongoose.js'

export async function resetDB(_payload: Payload, collectionSlugs: string[]) {
  if (isMongoose(_payload) && 'collections' in _payload.db && collectionSlugs.length > 0) {
    const firstCollectionSlug = collectionSlugs?.[0]

    if (!firstCollectionSlug?.length) {
      throw new Error('No collection slugs provided to reset the database.')
    }
    await _payload.db.collections[firstCollectionSlug]?.db.dropDatabase()
  } else if ('drizzle' in _payload.db) {
    const db = _payload.db as unknown as DrizzleAdapter

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
