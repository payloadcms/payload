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
  /**
   * Path prefixes of array / blocks fields that are being replaced in full, ex: `myBlocks.`
   *
   * Rows in the `_rels`, `_texts` and `_numbers` tables are keyed by a path that embeds the row
   * index of the array / block they belong to, ex: `myBlocks.1.myRelationship`. Deleting only the
   * paths that are about to be reinserted leaves rows behind whenever the field is saved with
   * fewer rows than it held before, so every path under these prefixes is deleted instead.
   */
  pathPrefixesToDelete: Set<string>
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
