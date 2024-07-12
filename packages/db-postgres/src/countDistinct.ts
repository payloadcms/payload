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
        // @ts-expect-error generic string is not matching union type from drizzle
        count: sql<string>`count
            (DISTINCT ${this.tables[tableName].id})`,
      })
      .from(this.tables[tableName])
      // @ts-expect-error where is picking up libsql types
      .where(where),
  })

  return Number(countResult[0].count)
}
