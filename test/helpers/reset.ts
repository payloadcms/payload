import { sql } from 'drizzle-orm'

import type { PostgresAdapter } from '../../packages/db-postgres/src/types'
import type { Payload } from '../../packages/payload/src'

import { collectionSlugs } from '../fields/collectionSlugs'
import { isMongoose } from './isMongoose'

export async function resetDB(_payload: Payload) {
  if (isMongoose(_payload)) {
    await _payload.db.collections[collectionSlugs[0]].db.dropDatabase()
  } else {
    const db: PostgresAdapter = _payload.db as unknown as PostgresAdapter

    /*await db.drizzle.execute(sql`drop schema public cascade;
      create schema public;`)*/

    // Deleting the schema causes issues when restoring the database from a snapshot later on. That's why we only delete the table data here,
    // To avoid having to re-create any table schemas / indexes / whatever
    const schema = db.drizzle._.schema
    if (!schema) {
      return
    }
    const queries = Object.values(schema).map((table: any) => {
      return sql.raw(`DELETE FROM ${table.dbName}`)
    })

    await db.drizzle.transaction(async (trx) => {
      await Promise.all(
        queries.map(async (query) => {
          if (query) {
            await trx.execute(query)
          }
        }),
      )
    })
  }
}
