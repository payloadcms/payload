import { sql } from 'drizzle-orm'

import type { PostgresAdapter } from '../types.js'

export const migrationTableExists = async (adapter: PostgresAdapter): Promise<boolean> => {
  const prependSchema = adapter.schemaName ? `"${adapter.schemaName}".` : ''

  const queryRes = await adapter.drizzle.execute(
    sql`SELECT to_regclass('${prependSchema}.payload_migrations');`,
  )

  // Returns table name 'payload_migrations' or null
  const exists = queryRes.rows?.[0]?.to_regclass === 'payload_migrations'
  return exists
}
