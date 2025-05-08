import { eq } from 'drizzle-orm'

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

  if (onConflictDoUpdate && this.disableOnConflictDoUpdate) {
    const id = onConflictDoUpdate.set.id
    const where = id !== undefined ? eq(table.id, id) : onConflictDoUpdate.targetWhere
    result = await (db as TransactionPg)
      .update(table)
      .set(onConflictDoUpdate.set)
      .where(where)
      .returning()

    if (result.length === 0) {
      result = await (db as TransactionPg).insert(table).values(values).returning()
    }
  } else if (onConflictDoUpdate) {
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
