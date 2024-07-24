import type { TransactionPg } from '@payloadcms/drizzle/types'

import type { DeleteWhere } from './types.js'

export const deleteWhere: DeleteWhere = async function deleteWhere({ db, tableName, where }) {
  const table = this.tables[tableName]
  await (db as TransactionPg).delete(table).where(where)
}
