import { eq } from 'drizzle-orm'

import type { Insert } from './types.js'

export const insert: Insert = async function insert({
  db,
  onConflictDoUpdate,
  tableName,
  values,
}): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]

  let IDPromise: Promise<number | string>

  if (onConflictDoUpdate) {
    IDPromise = db
      .insert(table)
      .values(values)
      .onDuplicateKeyUpdate(onConflictDoUpdate)
      .$returningId()
      .then(([{ id }]) => id)
  } else {
    IDPromise = db
      .insert(table)
      .values(values)
      .$returningId()
      .then(([{ id }]) => id)
  }

  const id = await IDPromise
  const docs = await db.select().from(table).where(eq(table.id, id))

  return docs
}
