import { pgEnum, pgSchema, pgTable } from 'drizzle-orm/pg-core'

import type { BasePostgresAdapter } from '../types.js'

/**
 * Returns the Drizzle schema (`pgSchema`, or the plain `pgTable` / `pgEnum` for `public`)
 * that a table or enum should be created in.
 * Without `adapter.tableSchema` this is always `adapter.pgSchema`.
 */
export const resolveSchema = ({
  name,
  type,
  adapter,
}: {
  adapter: BasePostgresAdapter
  name: string
  type: 'enum' | 'table'
}): BasePostgresAdapter['pgSchema'] => {
  // The migrations table is looked up in the default schema by `migrate`, `migrate:down` and push.
  if (!adapter.tableSchema || (type === 'table' && name === 'payload_migrations')) {
    return adapter.pgSchema
  }

  const schemaName = adapter.tableSchema({ name, type })

  if (!schemaName || schemaName === (adapter.schemaName || 'public')) {
    return adapter.pgSchema
  }

  if (schemaName === 'public') {
    return { enum: pgEnum, table: pgTable }
  }

  return pgSchema(schemaName)
}
