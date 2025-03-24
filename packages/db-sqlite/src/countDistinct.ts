import type { ChainedMethods } from '@payloadcms/drizzle/types'

import { chainMethods } from '@payloadcms/drizzle'
import { count, sql } from 'drizzle-orm'

import type { CountDistinct, SQLiteAdapter } from './types.js'

export const countDistinct: CountDistinct = async function countDistinct(
  this: SQLiteAdapter,
  { db, joins, tableName, where },
) {
  // When we don't have any joins - use a simple COUNT(*) query.
  if (joins.length === 0) {
    const countResult = await db
      .select({
        count: count(),
      })
      .from(this.tables[tableName])
      .where(where)
    return Number(countResult[0]?.count)
  }

  const chainedMethods: ChainedMethods = []

  joins.forEach(({ condition, table }) => {
    chainedMethods.push({
      args: [table, condition],
      method: 'leftJoin',
    })
  })

  // When we have any joins, we need to count each individual ID only once.
  // COUNT(*) doesn't work for this well in this case, as it also counts joined tables.
  // SELECT (COUNT DISTINCT id) has a very slow performance on large tables.
  // Instead, COUNT (GROUP BY id) can be used which is still slower than COUNT(*) but acceptable.
  const countResult = await chainMethods({
    methods: chainedMethods,
    query: db
      .select({
        count: sql`COUNT(1) OVER()`,
      })
      .from(this.tables[tableName])
      .where(where)
      .groupBy(this.tables[tableName].id)
      .limit(1),
  })

  return Number(countResult[0]?.count)
}
