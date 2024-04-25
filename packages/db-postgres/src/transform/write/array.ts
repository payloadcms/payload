/* eslint-disable no-param-reassign */
import type { ArrayField } from 'payload/types'

import type { PostgresAdapter } from '../../types'
import type { ArrayRowToInsert, BlockRowToInsert, RelationshipToDelete } from './types'

import { isArrayOfRows } from '../../utilities/isArrayOfRows'
import { traverseFields } from './traverseFields'

type Args = {
  adapter: PostgresAdapter
  arrayTableName: string
  baseTableName: string
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  blocksToDelete: Set<string>
  data: unknown
  field: ArrayField
  locale?: string
  numbers: Record<string, unknown>[]
  path: string
  relationships: Record<string, unknown>[]
  relationshipsToDelete: RelationshipToDelete[]
  selects: {
    [tableName: string]: Record<string, unknown>[]
  }
  texts: Record<string, unknown>[]
}

export const transformArray = ({
  adapter,
  arrayTableName,
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
}: Args) => {
  const newRows: ArrayRowToInsert[] = []

  const hasUUID = adapter.tables[arrayTableName]._uuid

  if (isArrayOfRows(data)) {
    data.forEach((arrayRow, i) => {
      const newRow: ArrayRowToInsert = {
        arrays: {},
        locales: {},
        row: {
          _order: i + 1,
        },
      }

      // If we have declared a _uuid field on arrays,
      // that means the ID has to be unique,
      // and our ids within arrays are not unique.
      // So move the ID to a uuid field for storage
      // and allow the database to generate a serial id automatically
      if (hasUUID) {
        newRow.row._uuid = arrayRow.id
        delete arrayRow.id
      }

      if (locale) {
        newRow.locales[locale] = {
          _locale: locale,
        }
      }

      if (field.localized) {
        newRow.row._locale = locale
      }

      traverseFields({
        adapter,
        arrays: newRow.arrays,
        baseTableName,
        blocks,
        blocksToDelete,
        columnPrefix: '',
        data: arrayRow,
        fieldPrefix: '',
        fields: field.fields,
        locales: newRow.locales,
        numbers,
        parentTableName: arrayTableName,
        path: `${path || ''}${field.name}.${i}.`,
        relationships,
        relationshipsToDelete,
        row: newRow.row,
        selects,
        texts,
      })

      newRows.push(newRow)
    })
  }

  return newRows
}
