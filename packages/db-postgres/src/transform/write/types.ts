export type ArrayRowToInsert = {
  columnName: string
  row: Record<string, unknown>,
  locales: {
    [locale: string]: Record<string, unknown>
  }
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  columnName: string
  locale: Record<string, unknown>
  row: Record<string, unknown>
}

export type BlockRowToInsert = {
  row: Record<string, unknown>,
  locales: {
    [locale: string]: Record<string, unknown>
  }
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  locale: Record<string, unknown>
  row: Record<string, unknown>
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
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  locale: Record<string, unknown>
  relationships: Record<string, unknown>[]
  row: Record<string, unknown>
}
