import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import type { DrizzleAdapter, PostgresDB } from '../types.js'

export const migrationTableExists = async (
  adapter: DrizzleAdapter,
  db?: LibSQLDatabase | PostgresDB,
): Promise<boolean> => {
  let statement

  if (adapter.name === 'postgres') {
    const prependSchema = adapter.schemaName ? `"${adapter.schemaName}".` : ''
    statement = `SELECT to_regclass('${prependSchema}"payload_migrations"') AS exists;`
  }

  if (adapter.name === 'sqlite') {
    statement = `
      SELECT CASE
               WHEN COUNT(*) > 0 THEN 1
               ELSE 0
               END AS 'exists'
      FROM sqlite_master
      WHERE type = 'table'
        AND name = 'payload_migrations';`
  }

  const result = await adapter.execute({
    drizzle: db ?? adapter.drizzle,
    raw: statement,
  })

  const [row] = result.rows

  return row && typeof row === 'object' && 'exists' in row && !!row.exists
}
