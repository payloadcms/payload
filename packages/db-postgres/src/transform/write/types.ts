export type ArrayRowToInsert = {
  columnName: string
  row: Record<string, unknown>,
  locales: {
    [locale: string]: Record<string, unknown>
  }
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
}

export type BlockRowToInsert = {
  row: Record<string, unknown>,
  locales: {
    [locale: string]: Record<string, unknown>
  }
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
}

export type RowToInsert = {
  row: Record<string, unknown>,
  locales: {
    [locale: string]: Record<string, unknown>
  }
  relationships: Record<string, unknown>[],
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
}
