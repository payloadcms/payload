import type { QueryPromise, SQL } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteSelect } from 'drizzle-orm/sqlite-core'

import type {
  DrizzleAdapter,
  DrizzleTransaction,
  GenericColumn,
  GenericPgColumn,
  TransactionPg,
  TransactionSQLite,
} from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

type Args = {
  adapter: DrizzleAdapter
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  forceRun?: boolean
  joins: BuildQueryJoinAliases
  query?: (args: { query: SQLiteSelect }) => SQLiteSelect
  selectFields: Record<string, GenericColumn>
  tableName: string
  where: SQL
}

/**
 * Selects distinct records from a table only if there are joins that need to be used, otherwise return null
 */
export const selectDistinct = ({
  adapter,
  db,
  forceRun,
  joins,
  query: queryModifier = ({ query }) => query,
  selectFields,
  tableName,
  where,
}: Args): QueryPromise<{ id: number | string }[] & Record<string, GenericColumn>> => {
  if (forceRun || Object.keys(joins).length > 0) {
    let query: SQLiteSelect
    const table = adapter.tables[tableName]

    if (adapter.name === 'postgres') {
      query = (db as TransactionPg)
        .selectDistinct(selectFields as Record<string, GenericPgColumn>)
        .from(table)
        .$dynamic() as unknown as SQLiteSelect
    }
    if (adapter.name === 'sqlite') {
      query = (db as TransactionSQLite)
        .selectDistinct(selectFields as Record<string, SQLiteColumn>)
        .from(table)
        .$dynamic()
    }

    if (where) {
      query = query.where(where)
    }

    joins.forEach(({ type, condition, table }) => {
      query = query[type ?? 'leftJoin'](table, condition)
    })

    return queryModifier({
      query,
    }) as unknown as QueryPromise<{ id: number | string }[] & Record<string, GenericColumn>>
  }
}
