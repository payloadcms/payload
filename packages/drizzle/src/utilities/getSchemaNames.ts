import type { PgEnum } from 'drizzle-orm/pg-core'

import { getTableConfig } from 'drizzle-orm/pg-core'

import type { BasePostgresAdapter } from '../postgres/types.js'

/**
 * Returns the names of all Postgres schemas the adapter uses: the default schema
 * (`schemaName`, or `public`) first, followed by every other schema that a table or enum was
 * built in, sorted by name.
 * Without `adapter.tableSchema` this is only the default schema.
 */
export const getSchemaNames = ({
  adapter,
}: {
  adapter: Pick<BasePostgresAdapter, 'enums' | 'schemaName' | 'tables' | 'tableSchema'>
}): string[] => {
  const defaultSchemaName = adapter.schemaName || 'public'

  if (!adapter.tableSchema) {
    return [defaultSchemaName]
  }

  const schemaNames = new Set<string>()

  for (const table of Object.values(adapter.tables)) {
    schemaNames.add(getTableConfig(table).schema ?? 'public')
  }

  for (const pgEnum of Object.values(adapter.enums) as PgEnum<[string, ...string[]]>[]) {
    schemaNames.add(pgEnum.schema ?? 'public')
  }

  schemaNames.delete(defaultSchemaName)

  return [defaultSchemaName, ...[...schemaNames].sort()]
}
