import type { Column, Table } from 'drizzle-orm'

import { getColumnTable, getTableName } from 'drizzle-orm'

export const getNameFromDrizzleTable = (table: Table): string => {
  return getTableName(table)
}

/**
 * In drizzle v1 the public `Column` type no longer exposes `.table`; use the
 * `getColumnTable` accessor to resolve the owning table's name.
 */
export const getTableNameFromColumn = (column: Column): string => {
  return getTableName(getColumnTable(column))
}
