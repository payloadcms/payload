import type { FlattenedField } from 'payload'

import type { DrizzleAdapter } from '../../types.js'
import type { RowToInsert } from './types.js'

import { traverseFields } from './traverseFields.js'

type Args = {
  adapter: DrizzleAdapter
  data: Record<string, unknown>
  fields: FlattenedField[]
  parentIsLocalized?: boolean
  path?: string
  tableName: string
}

export const transformForWrite = ({
  adapter,
  data,
  fields,
  parentIsLocalized,
  path = '',
  tableName,
}: Args): RowToInsert => {
  // Split out the incoming data into rows to insert / delete
  const rowToInsert: RowToInsert = {
    arrays: {},
    blocks: {},
    blocksToDelete: new Set(),
    locales: {},
    numbers: [],
    relationships: [],
    relationshipsToDelete: [],
    row: {},
    selects: {},
    texts: [],
  }

  // This function is responsible for building up the
  // above rowToInsert
  traverseFields({
    adapter,
    arrays: rowToInsert.arrays,
    baseTableName: tableName,
    blocks: rowToInsert.blocks,
    blocksToDelete: rowToInsert.blocksToDelete,
    columnPrefix: '',
    data,
    fieldPrefix: '',
    fields,
    locales: rowToInsert.locales,
    numbers: rowToInsert.numbers,
    parentIsLocalized,
    parentTableName: tableName,
    path,
    relationships: rowToInsert.relationships,
    relationshipsToDelete: rowToInsert.relationshipsToDelete,
    row: rowToInsert.row,
    selects: rowToInsert.selects,
    texts: rowToInsert.texts,
  })

  return rowToInsert
}
