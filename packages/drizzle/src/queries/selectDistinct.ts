import type { QueryPromise, SQL } from 'drizzle-orm'
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core'

import type { ChainedMethods } from '../find/chainMethods.js'
import type {
  DrizzleAdapter,
  DrizzleTransaction,
  GenericColumn,
  GenericPgColumn,
  TransactionPg,
  TransactionSQLite,
} from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

import { chainMethods } from '../find/chainMethods.js'

type Args = {
  adapter: DrizzleAdapter
  chainedMethods?: ChainedMethods
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  joins: BuildQueryJoinAliases
  selectFields: Record<string, GenericColumn>
  tableName: string
  where: SQL
}

/**
 * Selects distinct records from a table only if there are joins that need to be used, otherwise return null
 */
export const selectDistinct = ({
  adapter,
  chainedMethods = [],
  db,
  joins,
  selectFields,
  tableName,
  where,
}: Args): QueryPromise<{ id: number | string }[] & Record<string, GenericColumn>> => {
  if (Object.keys(joins).length > 0) {
    if (where) {
      chainedMethods.push({ args: [where], method: 'where' })
    }

    joins.forEach(({ condition, table }) => {
      chainedMethods.push({
        args: [table, condition],
        method: 'leftJoin',
      })
    })

    let query
    const table = adapter.tables[tableName]

    if (adapter.name === 'postgres') {
      query = (db as TransactionPg)
        .selectDistinct(selectFields as Record<string, GenericPgColumn>)
        .from(table)
    }
    if (adapter.name === 'sqlite') {
      query = (db as TransactionSQLite)
        .selectDistinct(selectFields as Record<string, SQLiteColumn>)
        .from(table)
    }

    return chainMethods({
      methods: chainedMethods,
      query,
    })
  }
}
