import type { Row } from '@libsql/client'

import type { DropDatabase, SQLiteAdapter } from './types.js'

const getTables = (adapter: SQLiteAdapter) => {
  return adapter.client.execute(`SELECT name
                                 FROM sqlite_master
                                 WHERE type = 'table'
                                   AND name NOT LIKE 'sqlite_%';`)
}

const dropTables = (adapter: SQLiteAdapter, rows: Row[]) => {
  const multi = `
  PRAGMA foreign_keys = OFF;\n
  ${rows.map(({ name }) => `DROP TABLE IF EXISTS ${name as string}`).join(';\n ')};\n
  PRAGMA foreign_keys = ON;`
  return adapter.client.executeMultiple(multi)
}

export const dropDatabase: DropDatabase = async function ({ adapter }) {
  const result = await getTables(adapter)
  await dropTables(adapter, result.rows)
}
