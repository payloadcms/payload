import type { Table } from 'drizzle-orm'

import { getTableName } from 'drizzle-orm'

export const getNameFromDrizzleTable = (table: Table): string => {
  const symbol = Object.getOwnPropertySymbols(table).find((symb) =>
    symb.description.includes('drizzle:BaseName'),
  )
  // Drizzle:Name or drizzle:BaseName sometimes returns a UUID. Example:
  // drizzle:BaseName: payload_locked_documents_rels
  // drizzle:Name: 131e2d64_3237_426b_8466_f28e0d2be653
  // getTableName(table): payload_locked_documents_rels

  return table[symbol] || getTableName(table)
}
