import { eq } from 'drizzle-orm'

import type { Insert, SQLiteAdapter } from './types.js'

export const insert: Insert = async function (
  // Here 'this' is not a parameter. See:
  // https://www.typescriptlang.org/docs/handbook/2/classes.html#this-parameters
  this: SQLiteAdapter,
  { db, onConflictDoUpdate, tableName, values },
): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]

  let result: any

  if (onConflictDoUpdate && this.disableOnConflictDoUpdate) {
    const id = onConflictDoUpdate.set.id
    const where = id !== undefined ? eq(table.id, id) : onConflictDoUpdate.targetWhere
    result = await db.update(table).set(onConflictDoUpdate.set).where(where).returning()

    if (result.length === 0) {
      result = await db.insert(table).values(values).returning()
    }
  } else if (onConflictDoUpdate) {
    result = await db
      .insert(table)
      .values(values)
      .onConflictDoUpdate(onConflictDoUpdate)
      .returning()
  } else {
    result = await db.insert(table).values(values).returning()
  }

  // See https://github.com/payloadcms/payload/pull/11831#discussion_r2010431908
  return result
}
