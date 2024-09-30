import type { ChainedMethods } from '@payloadcms/drizzle/types'

import { chainMethods } from '@payloadcms/drizzle'
import { count, sql } from 'drizzle-orm'

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
        count:
          joins.length > 0
            ? sql`count
    (DISTINCT ${this.tables[tableName].id})`.mapWith(Number)
            : count(),
      })
      .from(this.tables[tableName])
      .where(where),
  })

  return Number(countResult[0].count)
}
