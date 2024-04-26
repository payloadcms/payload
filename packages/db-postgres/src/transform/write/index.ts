/* eslint-disable no-param-reassign */
import type { Field } from 'payload/types'

import type { PostgresAdapter } from '../../types'
import type { RowToInsert } from './types'

import { traverseFields } from './traverseFields'

type Args = {
  adapter: PostgresAdapter
  data: Record<string, unknown>
  fields: Field[]
  path?: string
  tableName: string
}

export const transformForWrite = ({
  adapter,
  data,
  fields,
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
