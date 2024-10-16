import type { BlocksField } from 'payload'

import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../../types.js'
import type { BlockRowToInsert, RelationshipToDelete } from './types.js'

import { traverseFields } from './traverseFields.js'

type Args = {
  adapter: DrizzleAdapter
  baseTableName: string
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  blocksToDelete: Set<string>
  data: Record<string, unknown>[]
  field: BlocksField
  locale?: string
  numbers: Record<string, unknown>[]
  path: string
  relationships: Record<string, unknown>[]
  relationshipsToDelete: RelationshipToDelete[]
  selects: {
    [tableName: string]: Record<string, unknown>[]
  }
  texts: Record<string, unknown>[]
  /**
   * Set to a locale code if this set of fields is traversed within a
   * localized array or block field
   */
  withinArrayOrBlockLocale?: string
}
export const transformBlocks = ({
  adapter,
  baseTableName,
  blocks,
  blocksToDelete,
  data,
  field,
  locale,
  numbers,
  path,
  relationships,
  relationshipsToDelete,
  selects,
  texts,
  withinArrayOrBlockLocale,
}: Args) => {
  data.forEach((blockRow, i) => {
    if (typeof blockRow.blockType !== 'string') {
      return
    }
    const matchedBlock = field.blocks.find(({ slug }) => slug === blockRow.blockType)
    if (!matchedBlock) {
      return
    }
    const blockType = toSnakeCase(blockRow.blockType)

    if (!blocks[blockType]) {
      blocks[blockType] = []
    }

    const newRow: BlockRowToInsert = {
      arrays: {},
      locales: {},
      row: {
        _order: i + 1,
        _path: `${path}${field.name}`,
      },
    }

    if (field.localized && locale) {
      newRow.row._locale = locale
    }
    if (withinArrayOrBlockLocale) {
      newRow.row._locale = withinArrayOrBlockLocale
    }

    const blockTableName = adapter.tableNameMap.get(`${baseTableName}_blocks_${blockType}`)

    const hasUUID = adapter.tables[blockTableName]._uuid

    // If we have declared a _uuid field on arrays,
    // that means the ID has to be unique,
    // and our ids within arrays are not unique.
    // So move the ID to a uuid field for storage
    // and allow the database to generate a serial id automatically
    if (hasUUID) {
      newRow.row._uuid = blockRow.id
      delete blockRow.id
    }

    traverseFields({
      adapter,
      arrays: newRow.arrays,
      baseTableName,
      blocks,
      blocksToDelete,
      columnPrefix: '',
      data: blockRow,
      fieldPrefix: '',
      fields: matchedBlock.fields,
      locales: newRow.locales,
      numbers,
      parentTableName: blockTableName,
      path: `${path || ''}${field.name}.${i}.`,
      relationships,
      relationshipsToDelete,
      row: newRow.row,
      selects,
      texts,
      withinArrayOrBlockLocale,
    })

    blocks[blockType].push(newRow)
  })
}
