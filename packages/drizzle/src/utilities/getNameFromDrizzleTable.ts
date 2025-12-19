import type { Table } from 'drizzle-orm'

import { getTableName } from 'drizzle-orm'

export const getNameFromDrizzleTable = (table: Table): string => {
  return getTableName(table)
}
