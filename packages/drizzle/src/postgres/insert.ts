import type { TransactionPg } from '../types.js'
import type { Insert } from './types.js'

export const insert: Insert = async function insert({
  db,
  onConflictDoUpdate,
  tableName,
  values,
}): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]
  let result

  if (onConflictDoUpdate) {
    result = await (db as TransactionPg)
      .insert(table)
      .values(values)
      .onConflictDoUpdate(onConflictDoUpdate)
      .returning()
  } else {
    result = await (db as TransactionPg).insert(table).values(values).returning()
  }

  return result
}
