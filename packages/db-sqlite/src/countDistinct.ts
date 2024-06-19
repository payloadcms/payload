import type { ChainedMethods } from '@payloadcms/drizzle/types'

import { chainMethods } from '@payloadcms/drizzle'
import { sql } from 'drizzle-orm'

import type { CountDistinct, SQLiteAdapter } from './types.js'

export const countDistinct: CountDistinct = async function countDistinct(
  this: SQLiteAdapter,
  { db, joins, tableName, where },
) {
  const chainedMethods: ChainedMethods = []

  joins.forEach(({ condition, table }) => {
    chainedMethods.push({
      args: [table, condition],
      method: 'leftJoin',
    })
  })

  const countResult = await chainMethods({
    methods: chainedMethods,
    query: db
      .select({
        count: sql<number>`count
            (DISTINCT ${this.tables[tableName].id})`,
      })
      .from(this.tables[tableName])
      .where(where),
  })

  return Number(countResult[0].count)
}
