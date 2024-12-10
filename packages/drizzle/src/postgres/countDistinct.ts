import { count } from 'drizzle-orm'

import type { ChainedMethods, TransactionPg } from '../types.js'
import type { BasePostgresAdapter, CountDistinct } from './types.js'

import { chainMethods } from '../find/chainMethods.js'

export const countDistinct: CountDistinct = async function countDistinct(
  this: BasePostgresAdapter,
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
    query: (db as TransactionPg)
      .select({
        count: count(),
      })
      .from(this.tables[tableName])
      .where(where),
  })

  return Number(countResult[0].count)
}
