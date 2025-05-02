import type { Table } from 'drizzle-orm'

export const getNameFromDrizzleTable = (table: Table): string => {
  const symbol = Object.getOwnPropertySymbols(table).find((symb) =>
    symb.description.includes('Name'),
  )

  return table[symbol]
}
