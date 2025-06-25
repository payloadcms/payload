import type { DeleteWhere, SQLiteAdapter } from './types.js'

export const deleteWhere: DeleteWhere = async function (
  // Here 'this' is not a parameter. See:
  // https://www.typescriptlang.org/docs/handbook/2/classes.html#this-parameters
  this: SQLiteAdapter,
  { db, tableName, where },
) {
  const table = this.tables[tableName]
  await db.delete(table).where(where)
}
