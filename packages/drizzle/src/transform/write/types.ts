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
  /**
   * The placements of blocks this write rewrites, for clearing rows of theirs left in another numbered table of the
   * same block
   */
  blockPlacements: BlockPlacement[]
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

/**
 * A `blocks` field offering a block, which stores the block's rows in one of the block's tables: the first placement
 * of a block that differs between placements gets the plain table name and later ones a numbered variant of it
 */
export type BlockPlacement = {
  /** The block's table name without a number, which every variant of it starts with */
  baseBlockTableName: string
  /** The `_path` of the field's rows with the row indexes left out */
  path: string
  /** The table the placement's rows are written to */
  tableName: string
}
