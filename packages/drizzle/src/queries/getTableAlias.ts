import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'

import { alias } from 'drizzle-orm/pg-core'
import { alias as aliasSQLite } from 'drizzle-orm/sqlite-core/alias'
import toSnakeCase from 'to-snake-case'
import { v4 as uuid } from 'uuid'

import type { DrizzleAdapter } from '../types.js'

type Table = PgTableWithColumns<any> | SQLiteTableWithColumns<any>
export const getTableAlias = ({
  adapter,
  tableName,
}: {
  adapter: DrizzleAdapter
  tableName: string
}): {
  newAliasTable: Table
  newAliasTableName: string
} => {
  const newAliasTableName = toSnakeCase(uuid())
  let newAliasTable

  if (adapter.name === 'postgres') {
    newAliasTable = alias(adapter.tables[tableName], newAliasTableName)
  }
  if (adapter.name === 'sqlite') {
    newAliasTable = aliasSQLite(adapter.tables[tableName], newAliasTableName)
  }

  return { newAliasTable, newAliasTableName }
}
