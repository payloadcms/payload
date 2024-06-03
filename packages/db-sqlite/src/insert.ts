import type { SQLiteAdapter } from './types.js'

export const insert: SQLiteAdapter['insert'] = async function insert({
  db,
  onConflictDoUpdate,
  tableName,
  values,
}): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]
  let result

  if (onConflictDoUpdate) {
    result = db.insert(table).values(values).onConflictDoUpdate(onConflictDoUpdate).get()
  } else {
    result = db.insert(table).values(values).get()
  }
  result = await result
  return result
}
