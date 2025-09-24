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

  // See https://github.com/payloadcms/payload/pull/11831#discussion_r2010431908
  return result as Record<string, unknown>[]
}
