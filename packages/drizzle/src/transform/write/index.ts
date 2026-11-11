import type { FlattenedField } from 'payload'

import { APIError, deepCopyObjectSimple } from 'payload'

import type { DrizzleAdapter } from '../../types.js'
import type { RowToInsert } from './types.js'

import { traverseFields } from './traverseFields.js'

type Args = {
  adapter: DrizzleAdapter
  data: Record<string, unknown>
  enableAtomicWrites?: boolean
  fields: FlattenedField[]
  parentIsLocalized?: boolean
  path?: string
  tableName: string
}

export const transformForWrite = ({
  adapter,
  data,
  enableAtomicWrites,
  fields,
  parentIsLocalized,
  path = '',
  tableName,
}: Args): RowToInsert => {
  // Split out the incoming data into rows to insert / delete
  const rowToInsert: RowToInsert = {
    arrays: {},
    arraysToPush: {},
    blocks: {},
    blocksToDelete: new Set(),
    locales: {},
    numbers: [],
    numbersToDelete: [],
    relationships: [],
    relationshipsToAppend: [],
    relationshipsToDelete: [],
    row: {},
    selects: {},
    texts: [],
    textsToDelete: [],
  }

  // This function is responsible for building up the
  // above rowToInsert
  traverseFields({
    adapter,
    arrays: rowToInsert.arrays,
    arraysToPush: rowToInsert.arraysToPush,
    baseTableName: tableName,
    blocks: rowToInsert.blocks,
    blocksToDelete: rowToInsert.blocksToDelete,
    columnPrefix: '',
    // Traversal rewrites row IDs and annotates nested groups for relational storage.
    data: deepCopyObjectSimple(data),
    enableAtomicWrites,
    fieldPrefix: '',
    fields,
    locales: rowToInsert.locales,
    numbers: rowToInsert.numbers,
    numbersToDelete: rowToInsert.numbersToDelete,
    parentIsLocalized,
    parentTableName: tableName,
    path,
    relationships: rowToInsert.relationships,
    relationshipsToAppend: rowToInsert.relationshipsToAppend,
    relationshipsToDelete: rowToInsert.relationshipsToDelete,
    row: rowToInsert.row,
    selects: rowToInsert.selects,
    texts: rowToInsert.texts,
    textsToDelete: rowToInsert.textsToDelete,
  })

  const seen = new Map<string, Set<string>>()
  const checkRows = ({
    tables,
  }: {
    tables: Record<
      string,
      {
        arrays: RowToInsert['arrays']
        arraysToPush: RowToInsert['arrays']
        row: Record<string, unknown>
      }[]
    >
  }) => {
    for (const [tableName, rows] of Object.entries(tables)) {
      for (const item of rows) {
        if (item.row._uuid !== undefined && item.row._uuid !== null) {
          const publicID = item.row._uuid

          if (typeof publicID !== 'string' && typeof publicID !== 'number') {
            throw new APIError('Array and block public IDs must be strings or numbers.', 400)
          }
          const ids = seen.get(tableName) ?? new Set<string>()
          const id = String(publicID)

          if (ids.has(id)) {
            throw new APIError(`Duplicate public row ID in table ${tableName}.`, 400)
          }
          ids.add(id)
          seen.set(tableName, ids)
        }
        checkRows({ tables: item.arrays })
        checkRows({ tables: item.arraysToPush })
      }
    }
  }

  checkRows({ tables: rowToInsert.arrays })
  checkRows({ tables: rowToInsert.arraysToPush })
  checkRows({ tables: rowToInsert.blocks })
  return rowToInsert
}
