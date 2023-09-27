/* eslint-disable no-param-reassign */
import type { Field } from 'payload/types'

import type { RowToInsert } from './types'

import { traverseFields } from './traverseFields'

type Args = {
  data: Record<string, unknown>
  fields: Field[]
  path?: string
  tableName: string
}

export const transformForWrite = ({ data, fields, path = '', tableName }: Args): RowToInsert => {
  // Split out the incoming data into rows to insert / delete
  const rowToInsert: RowToInsert = {
    arrays: {},
    blocks: {},
    locales: {},
    numbers: [],
    relationships: [],
    relationshipsToDelete: [],
    row: {},
    selects: {},
  }

  // This function is responsible for building up the
  // above rowToInsert
  traverseFields({
    arrays: rowToInsert.arrays,
    baseTableName: tableName,
    blocks: rowToInsert.blocks,
    columnPrefix: '',
    data,
    fieldPrefix: '',
    fields,
    locales: rowToInsert.locales,
    numbers: rowToInsert.numbers,
    parentTableName: tableName,
    path,
    relationships: rowToInsert.relationships,
    relationshipsToDelete: rowToInsert.relationshipsToDelete,
    row: rowToInsert.row,
    selects: rowToInsert.selects,
  })

  return rowToInsert
}
