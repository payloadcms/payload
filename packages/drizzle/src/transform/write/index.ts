import type { FlattenedField } from 'payload'

import type { DrizzleAdapter } from '../../types.js'
import type { RowToInsert } from './types.js'

import { branchProjectionLocaleKey } from '../../branching/projectionLocaleNamespace.js'
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
    data,
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

  if (
    adapter.name === 'postgres' &&
    adapter.tables[`${tableName}${adapter.localesSuffix}`]?.[branchProjectionLocaleKey] &&
    Object.keys(rowToInsert.locales).length
  ) {
    const branchKey = rowToInsert.row._branchProjection_branchKey

    if (typeof branchKey !== 'string' || !/^bp2:[\w-]{43}$/.test(branchKey)) {
      throw new Error('Private branch projection locale writes require an encoded branch key.')
    }

    for (const locale of Object.values(rowToInsert.locales)) {
      locale[branchProjectionLocaleKey] = branchKey
    }
  }

  return rowToInsert
}
