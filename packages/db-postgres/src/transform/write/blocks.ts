/* eslint-disable no-param-reassign */
import type { BlockField } from 'payload/types'

import toSnakeCase from 'to-snake-case'

import type { BlockRowToInsert, RelationshipToDelete } from './types'

import { traverseFields } from './traverseFields'

type Args = {
  baseTableName: string
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
}
export const transformBlocks = ({
  baseTableName,
  blocks,
  data,
  field,
  locale,
  numbers,
  path,
  relationships,
  relationshipsToDelete,
  selects,
}: Args) => {
  data.forEach((blockRow, i) => {
    if (typeof blockRow.blockType !== 'string') return
    const matchedBlock = field.blocks.find(({ slug }) => slug === blockRow.blockType)
    if (!matchedBlock) return
    const blockType = toSnakeCase(blockRow.blockType)

    if (!blocks[blockType]) blocks[blockType] = []

    const newRow: BlockRowToInsert = {
      arrays: {},
      locales: {},
      row: {
        _order: i + 1,
        _path: `${path}${field.name}`,
      },
    }

    if (field.localized && locale) newRow.row._locale = locale

    const blockTableName = `${baseTableName}_${blockType}`

    traverseFields({
      arrays: newRow.arrays,
      baseTableName,
      blocks,
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
    })

    blocks[blockType].push(newRow)
  })
}
