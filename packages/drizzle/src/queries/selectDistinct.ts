import type { QueryPromise, SQL } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteSelect } from 'drizzle-orm/sqlite-core'

import type {
  DrizzleAdapter,
  DrizzleTransaction,
  GenericColumn,
  TransactionSQLite,
} from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

type Args = {
  adapter: DrizzleAdapter
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  /**
   * Skip `SELECT DISTINCT` and use a plain `select`. Callers that select a unique key (e.g.
   * findMany resolving row ids) don't need DISTINCT, and it must be avoided when the query has an
   * ORDER BY expression not in the select list (e.g. the `near` distance sort), which Postgres
   * rejects under DISTINCT.
   */
  disableDistinct?: boolean
  forceRun?: boolean
  hasAggregates?: boolean
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
  disableDistinct,
  forceRun,
  hasAggregates,
  joins,
  query: queryModifier = ({ query }) => query,
  selectFields,
  tableName,
  where,
}: Args): QueryPromise<{ id: number | string }[] & Record<string, GenericColumn>> => {
  if (forceRun || Object.keys(joins).length > 0) {
    let query: SQLiteSelect
    const table = adapter.tables[tableName]

    // With hasAggregate we use groupBy so we don't need to use selectDistinct in that case.
    // @ts-expect-error - Drizzle types are not accurate here
    let selectFunc: TransactionSQLite['selectDistinct'] =
      hasAggregates || disableDistinct ? db.select : db.selectDistinct

    // bind this otherwise we get TypeError: Cannot read properties of undefined (reading 'session')
    selectFunc = selectFunc.bind(db)

    // Virtual/unresolved sort fields can leave nullish entries in selectFields; drizzle's
    // select builder throws when a selected field is null/undefined, so filter them out.
    const cleanedSelectFields = Object.fromEntries(
      Object.entries(selectFields).filter(([, column]) => column != null),
    )

    query = selectFunc(cleanedSelectFields as Record<string, SQLiteColumn>)
      .from(table)
      .$dynamic() as unknown as SQLiteSelect

    if (where) {
      query = query.where(where)
    }

    joins.forEach(({ type, condition, table }) => {
      query = query[type ?? 'leftJoin'](table, condition)
    })

    if (hasAggregates && '_selected' in selectFields) {
      query = query.groupBy(selectFields['_selected'])
    }

    return queryModifier({
      query,
    }) as unknown as QueryPromise<{ id: number | string }[] & Record<string, GenericColumn>>
  }
}
