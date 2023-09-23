/* eslint-disable no-param-reassign */
import type { ArrayField } from 'payload/types'

import type { ArrayRowToInsert, BlockRowToInsert, RelationshipToDelete } from './types'

import { isArrayOfRows } from '../../utilities/isArrayOfRows'
import { traverseFields } from './traverseFields'

type Args = {
  arrayTableName: string
  baseTableName: string
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
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
}

export const transformArray = ({
  arrayTableName,
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
  const newRows: ArrayRowToInsert[] = []

  if (isArrayOfRows(data)) {
    data.forEach((arrayRow, i) => {
      const newRow: ArrayRowToInsert = {
        arrays: {},
        locales: {},
        row: {
          _order: i + 1,
        },
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
        arrays: newRow.arrays,
        baseTableName,
        blocks,
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
      })

      newRows.push(newRow)
    })
  }

  return newRows
}
