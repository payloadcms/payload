import type { ChainedMethods } from '@payloadcms/drizzle/types'

import { chainMethods } from '@payloadcms/drizzle'
import { sql } from 'drizzle-orm'

import type { SQLiteAdapter } from './types.js'

export const countDistinct: SQLiteAdapter['countDistinct'] = async function countDistinct(
  this: SQLiteAdapter,
  { db, joins, tableName, where },
) {
  const selectCountMethods: ChainedMethods = []

  Object.entries(joins).forEach(([joinTable, condition]) => {
    if (joinTable) {
      selectCountMethods.push({
        args: [this.tables[joinTable], condition],
        method: 'leftJoin',
      })
    }
  })

  const countResult = await chainMethods({
    methods: selectCountMethods,
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
