export type ArrayRowToInsert = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  arraysToPush: {
    [tableName: string]: ArrayRowToInsert[]
  }
  locales: {
    [locale: string]: Record<string, unknown>
  }
  row: Record<string, unknown>
}

export type BlockRowToInsert = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  arraysToPush: {
    [tableName: string]: ArrayRowToInsert[]
  }
  locales: {
    [locale: string]: Record<string, unknown>
  }
  row: Record<string, unknown>
}

export type RelationshipToDelete = {
  itemToRemove?: any // For $remove operations - stores the item data to match
  locale?: string
  path: string
  relationTo?: string // For simple relationships - stores the relationTo field
}

export type RelationshipToAppend = {
  locale?: string
  path: string
  relationTo?: string // For polymorphic relationships
  value: any
}

export type TextToDelete = {
  locale?: string
  path: string
}

export type NumberToDelete = {
  locale?: string
  path: string
}

export type RowToInsert = {
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  arraysToPush: {
    [tableName: string]: ArrayRowToInsert[]
  }
  blocks: {
    [tableName: string]: BlockRowToInsert[]
  }
  blocksToDelete: Set<string>
  locales: {
    [locale: string]: Record<string, unknown>
  }
  numbers: Record<string, unknown>[]
  numbersToDelete: NumberToDelete[]
  relationships: Record<string, unknown>[]
  relationshipsToAppend: RelationshipToAppend[]
  relationshipsToDelete: RelationshipToDelete[]
  row: Record<string, unknown>
  selects: {
    [tableName: string]: Record<string, unknown>[]
  }
  texts: Record<string, unknown>[]
  textsToDelete: TextToDelete[]
}
