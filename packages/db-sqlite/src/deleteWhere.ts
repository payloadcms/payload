import type { SQLiteAdapter } from './types.js'

export const deleteWhere: SQLiteAdapter['deleteWhere'] = async function deleteWhere({
  db,
  tableName,
  where,
}) {
  const table = this.tables[tableName]
  await db.delete(table).where(where)
}
