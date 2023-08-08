export type ArrayRowToInsert = {
  columnName: string
  parentTableName: string
  row: Record<string, unknown>,
  locale: Record<string, unknown>
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
}

export type BlockRowToInsert = {
  row: Record<string, unknown>,
  locale: Record<string, unknown>
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
}

export type RowToInsert = {
  row: Record<string, unknown>,
  locale: Record<string, unknown>,
  relationships: Record<string, unknown>[],
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
}
