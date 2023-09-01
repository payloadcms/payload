export type ArrayRowToInsert = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  columnName: string
  locale: Record<string, unknown>
  row: Record<string, unknown>,
}

export type BlockRowToInsert = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  locale: Record<string, unknown>
  row: Record<string, unknown>,
}

export type RowToInsert = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  locale: Record<string, unknown>,
  relationships: Record<string, unknown>[],
  row: Record<string, unknown>,
}
