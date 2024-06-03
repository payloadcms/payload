import type { PostgresAdapter } from './types.js'

export const insert: PostgresAdapter['insert'] = async function insert({
  db,
  onConflictDoUpdate,
  tableName,
  values,
}): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName]
  let result

  if (onConflictDoUpdate) {
    result = await db
      .insert(table)
      .values(values)
      .onConflictDoUpdate(onConflictDoUpdate)
      .returning()
  } else {
    result = await db.insert(table).values(values).returning()
  }

  return result
}
