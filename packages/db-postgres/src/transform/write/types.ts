export type ArrayRowToInsert = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  columnName: string
  locales: {
    [locale: string]: Record<string, unknown>
  }
  row: Record<string, unknown>,
}

export type BlockRowToInsert = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  locales: {
    [locale: string]: Record<string, unknown>
  }
  row: Record<string, unknown>,
}

export type RowToInsert = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  locales: {
    [locale: string]: Record<string, unknown>
  }
  relationships: Record<string, unknown>[],
  row: Record<string, unknown>,
}
