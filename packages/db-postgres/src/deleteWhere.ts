import type { PostgresAdapter } from './types.js'

export const deleteWhere: PostgresAdapter['deleteWhere'] = async function deleteWhere({
  db,
  tableName,
  where,
}) {
  const table = this.tables[tableName]
  await db.delete(table).where(where)
}
