import type { Insert, SQLiteAdapter } from './types.js'

export const insert: Insert = async function (
  // Here 'this' is not a parameter. See:
  // https://www.typescriptlang.org/docs/handbook/2/classes.html#this-parameters
  this: SQLiteAdapter,
  { db, onConflictDoUpdate, tableName, values },
): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]

  const result = onConflictDoUpdate
    ? await db.insert(table).values(values).onConflictDoUpdate(onConflictDoUpdate).returning()
    : await db.insert(table).values(values).returning()

  // TODO: this is possibly a bug. Result is of type 'any[] | ResultSet', but ResultSet
  // is not an array!
  return result as Record<string, unknown>[]
}
