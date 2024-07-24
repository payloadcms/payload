import type { ChainedMethods, TransactionPg } from '@payloadcms/drizzle/types'

import { chainMethods } from '@payloadcms/drizzle'
import { sql } from 'drizzle-orm'

import type { CountDistinct, PostgresAdapter } from './types.js'

export const countDistinct: CountDistinct = async function countDistinct(
  this: PostgresAdapter,
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
        count: sql<string>`count
            (DISTINCT ${this.tables[tableName].id})`,
      })
      .from(this.tables[tableName])
      .where(where),
  })

  return Number(countResult[0].count)
}
