import type { PostgresAdapter } from './types.js'

export const execute: PostgresAdapter['execute'] = async function execute({ db, sql }) {
  await db.execute(sql)
}
