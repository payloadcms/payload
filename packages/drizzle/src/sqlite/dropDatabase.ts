import type { SQLiteRaw } from 'drizzle-orm/sqlite-core/query-builders/raw'

import { sql } from 'drizzle-orm'

import type { BaseSQLiteAdapter, DropDatabase } from './types.js'

const getTables = (
  adapter: BaseSQLiteAdapter,
): Promise<SQLiteRaw<{ rows: { name: string }[] }>> => {
  return adapter.execute({
    db: (adapter as any).drizzle,
    sql: sql`
SELECT name
                                 FROM sqlite_master
                                 WHERE type = 'table'
                                   AND name NOT LIKE 'sqlite_%';
    `,
  }) as unknown as Promise<SQLiteRaw<{ rows: { name: string }[] }>>
}

const dropTables = async (adapter: BaseSQLiteAdapter, rows: { name: string }[]) => {
  const multi: string[] = [
    'PRAGMA foreign_keys = OFF;',
    ...rows.map(({ name }) => `DROP TABLE IF EXISTS ${name};`),
    'PRAGMA foreign_keys = ON;',
  ]

  for (const statement of multi) {
    adapter.payload.logger.debug({ msg: `Executing SQL: ${statement}` })
    await adapter.execute({ db: (adapter as any).drizzle, sql: sql.raw(statement) })
  }
}

export const dropDatabase: DropDatabase = async function ({ adapter }) {
  const result = await getTables(adapter)
  await dropTables(adapter, result.rows)
}
