import type { QueryPromise, SQL } from 'drizzle-orm'
import type { SQLiteColumn, SQLiteSelect } from 'drizzle-orm/sqlite-core'

import { asc, max, min } from 'drizzle-orm' // NEW: import aggregates

import type {
  DrizzleAdapter,
  DrizzleTransaction,
  GenericColumn,
  GenericPgColumn,
  TransactionPg,
  TransactionSQLite,
} from '../types.js'
import type { BuildOrderByResult } from './buildOrderBy.js' // NEW
import type { BuildQueryJoinAliases } from './buildQuery.js'

import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js'

type Args = {
  adapter: DrizzleAdapter
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  forceRun?: boolean
  joins: BuildQueryJoinAliases
  orderBy?: BuildOrderByResult // NEW: array field metadata
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
  orderBy, // NEW
  query: queryModifier = ({ query }) => query,
  selectFields,
  tableName,
  where,
}: Args): QueryPromise<{ id: number | string }[] & Record<string, GenericColumn>> => {
  if (forceRun || Object.keys(joins).length > 0) {
    // NEW: Check if any sort column is from array field
    const hasArrayFieldSort = orderBy?.some((o) => o.isArrayField) ?? false

    let query: SQLiteSelect
    const table = adapter.tables[tableName]

    if (adapter.name === 'postgres') {
      if (hasArrayFieldSort) {
        // NEW: Use aggregation for array field sorts
        const aggregatedFields: Record<string, GenericColumn> = {}

        // Always select the ID (no aggregation needed)
        aggregatedFields.id = table.id as GenericPgColumn

        // For each select field, apply MIN or MAX if it's an array sort column
        for (const [key, column] of Object.entries(selectFields)) {
          if (key === 'id') {continue} // Already handled

          const sortInfo = orderBy?.find(
            (o) =>
              o.column.name === column.name &&
              getNameFromDrizzleTable(o.column.table) === getNameFromDrizzleTable(column.table),
          )

          if (sortInfo?.isArrayField) {
            // Apply aggregate based on sort direction
            const aggregateFn = sortInfo.order === asc ? min : max
            aggregatedFields[key] = aggregateFn(column as GenericPgColumn).as(
              key,
            ) as unknown as GenericPgColumn
          } else {
            // Non-array fields: no aggregation
            aggregatedFields[key] = column as GenericPgColumn
          }
        }

        query = (db as TransactionPg)
          .select(aggregatedFields as Record<string, GenericPgColumn>)
          .from(table)
          .$dynamic() as unknown as SQLiteSelect
      } else {
        // Original path: use selectDistinct
        query = (db as TransactionPg)
          .selectDistinct(selectFields as Record<string, GenericPgColumn>)
          .from(table)
          .$dynamic() as unknown as SQLiteSelect
      }
    }
    if (adapter.name === 'sqlite') {
      if (hasArrayFieldSort) {
        // NEW: Same logic for SQLite
        const aggregatedFields: Record<string, GenericColumn> = {}

        aggregatedFields.id = table.id as SQLiteColumn

        for (const [key, column] of Object.entries(selectFields)) {
          if (key === 'id') {continue}

          const sortInfo = orderBy?.find(
            (o) =>
              o.column.name === column.name &&
              getNameFromDrizzleTable(o.column.table) === getNameFromDrizzleTable(column.table),
          )

          if (sortInfo?.isArrayField) {
            const aggregateFn = sortInfo.order === asc ? min : max
            aggregatedFields[key] = aggregateFn(column as SQLiteColumn).as(
              key,
            ) as unknown as SQLiteColumn
          } else {
            aggregatedFields[key] = column as SQLiteColumn
          }
        }

        query = (db as TransactionSQLite)
          .select(aggregatedFields as Record<string, SQLiteColumn>)
          .from(table)
          .$dynamic()
      } else {
        query = (db as TransactionSQLite)
          .selectDistinct(selectFields as Record<string, SQLiteColumn>)
          .from(table)
          .$dynamic()
      }
    }

    if (where) {
      query = query.where(where)
    }

    joins.forEach(({ type, condition, table }) => {
      query = query[type ?? 'leftJoin'](table, condition)
    })

    // NEW: Add GROUP BY when aggregating
    if (hasArrayFieldSort) {
      query = query.groupBy(table.id)
    }

    return queryModifier({
      query,
    }) as unknown as QueryPromise<{ id: number | string }[] & Record<string, GenericColumn>>
  }
}
