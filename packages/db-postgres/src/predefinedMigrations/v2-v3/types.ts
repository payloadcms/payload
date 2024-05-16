export type ColumnToCreate = {
  columnName: string
  columnType?: 'integer' | 'numeric' | 'uuid' | 'varchar'
  notNull: boolean
  tableName: string
}

/**
 * Map of all relations to query which should be moved
 * Key is the root table name and value is array of path matches
 * This will be built up into one WHERE query
 */
export type WhereConditionMap = Map<string, string[]>

export type DocsToResave = {
  [id: number | string]: Record<string, unknown>[]
}
