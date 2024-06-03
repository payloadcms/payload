import type { SQLiteAdapter } from './types.js'

export const execute: SQLiteAdapter['execute'] = async function execute({ db, sql }) {
  await db.execute(sql)
}
