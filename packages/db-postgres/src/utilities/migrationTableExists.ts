import { sql } from 'drizzle-orm'

import type { PostgresAdapter } from '../types.js'

export const migrationTableExists = async (adapter: PostgresAdapter): Promise<boolean> => {
  let statement

  if (adapter.name === 'postgres') {
    const prependSchema = adapter.schemaName ? `"${adapter.schemaName}".` : ''
    statement = `SELECT to_regclass('${prependSchema}"payload_migrations"') AS exists;`
  }

  const result = await adapter.drizzle.execute(sql.raw(statement))

  const [row] = result.rows

  return row && typeof row === 'object' && 'exists' in row && !!row.exists
}
