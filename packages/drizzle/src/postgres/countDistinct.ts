import { count, sql } from 'drizzle-orm'

import type { ChainedMethods, TransactionPg } from '../types.js'
import type { BasePostgresAdapter, CountDistinct } from './types.js'

import { chainMethods } from '../find/chainMethods.js'

export const countDistinct: CountDistinct = async function countDistinct(
  this: BasePostgresAdapter,
  { db, joins, tableName, where },
) {
  const chainedMethods: ChainedMethods = []

  // COUNT(DISTINCT id)  is slow on large tables, so we only use DISTINCT if we have to
  const visitedPaths = new Set([])
  let useDistinct = false
  joins.forEach(({ condition, queryPath, table }) => {
    if (!useDistinct && queryPath) {
      if (visitedPaths.has(queryPath)) {
        useDistinct = true
      } else {
        visitedPaths.add(queryPath)
      }
    }
    chainedMethods.push({
      args: [table, condition],
      method: 'leftJoin',
    })
  })

  const countResult = await chainMethods({
    methods: chainedMethods,
    query: (db as TransactionPg)
      .select({
        count: useDistinct ? sql`COUNT(DISTINCT ${this.tables[tableName].id})` : count(),
      })
      .from(this.tables[tableName])
      .where(where),
  })

  return Number(countResult[0].count)
}
