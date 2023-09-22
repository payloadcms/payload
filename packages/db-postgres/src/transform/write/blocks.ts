/* eslint-disable no-param-reassign */
import type { BlockField } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { BlockRowToInsert, RelationshipToDelete } from './types'

import { traverseFields } from './traverseFields'

type Args = {
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  data: Record<string, unknown>[]
  field: BlockField
  locale?: string
  numbers: Record<string, unknown>[]
  path: string
  relationships: Record<string, unknown>[]
  relationshipsToDelete: RelationshipToDelete[]
  selects: {
    [tableName: string]: Record<string, unknown>[]
  }
  tableName
}
export const transformBlocks = ({
  blocks,
  data,
  field,
  locale,
  numbers,
  path,
  relationships,
  relationshipsToDelete,
  selects,
  tableName,
}: Args) => {
  data.forEach((blockRow, i) => {
    if (typeof blockRow.blockType !== 'string') return
    const matchedBlock = field.blocks.find(({ slug }) => slug === blockRow.blockType)
    if (!matchedBlock) return

    if (!blocks[blockRow.blockType]) blocks[blockRow.blockType] = []

    const newRow: BlockRowToInsert = {
      arrays: {},
      locales: {},
      row: {
        _order: i + 1,
        _path: `${path}${field.name}`,
      },
    }

    if (field.localized && locale) newRow.row._locale = locale

    const blockTableName = `${tableName}_${toSnakeCase(blockRow.blockType)}`

    traverseFields({
      arrays: newRow.arrays,
      blocks,
      columnPrefix: '',
      data: blockRow,
      fields: matchedBlock.fields,
      locales: newRow.locales,
      newTableName: blockTableName,
      numbers,
      parentTableName: blockTableName,
      path: `${path || ''}${field.name}.${i}.`,
      relationships,
      relationshipsToDelete,
      row: newRow.row,
      selects,
    })

    blocks[blockRow.blockType].push(newRow)
  })
}
