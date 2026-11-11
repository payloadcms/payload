export type RowIDColumn = {
  [key: string]: unknown
  default?: unknown
  name: string
  primaryKey?: boolean
  type: string
}

export type RowIDTable = {
  [key: string]: unknown
  columns: Record<string, RowIDColumn>
  compositePrimaryKeys?: Record<string, unknown>
  foreignKeys: Record<
    string,
    {
      [key: string]: unknown
      columnsFrom: string[]
      columnsTo: string[]
      schemaTo?: string
      tableFrom: string
      tableTo: string
    }
  >
  indexes: Record<string, unknown>
  name: string
  schema?: string
  uniqueConstraints?: Record<string, unknown>
}

export type RowIDSnapshot = {
  [key: string]: unknown
  dialect: string
  tables: Record<string, RowIDTable>
}

export type RowIDMigrationPlan = {
  createStatements: string[]
  dialect: 'postgresql' | 'sqlite'
  idType: 'number' | 'uuid' | 'uuidv7'
  indexStatements: string[]
  tables: {
    columns: string[]
    conversion?: {
      direction: 'down' | 'up'
      newType: string
      oldType: string
    }
    foreignKeys: { column: string; target: string }[]
    key: string
    knownIndexes: string[]
    mapping: string
    name: string
    schema?: string
    serialColumns: string[]
    temporary: string
  }[]
}
