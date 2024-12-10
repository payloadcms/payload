import type { DeleteWhere } from './types.js'

export const deleteWhere: DeleteWhere = async function deleteWhere({ db, tableName, where }) {
  const table = this.tables[tableName]
  await db.delete(table).where(where)
}
