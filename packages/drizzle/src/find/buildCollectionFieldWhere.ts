import type { Where } from 'payload'

import { getTableName } from 'drizzle-orm'

import type { BuildQueryJoinAliases } from '../queries/buildQuery.js'
import type { DrizzleAdapter, GenericTable } from '../types.js'

import { addJoinTable } from '../queries/addJoinTable.js'
import { parseParams } from '../queries/parseParams.js'

export function buildCollectionFieldWhere({
  adapter,
  collection,
  joins,
  locale,
  table,
  where,
}: {
  adapter: DrizzleAdapter
  collection: string
  joins: BuildQueryJoinAliases
  locale?: string
  table: GenericTable
  where: Where
}) {
  const collectionJoins = [...joins]
  const whereConstraint = parseParams({
    adapter,
    context: { sort: undefined },
    fields: adapter.payload.collections[collection].config.flattenedFields,
    joins: collectionJoins,
    locale,
    parentIsLocalized: false,
    selectFields: { id: table['id'] },
    tableName: getTableName(table),
    where,
  })

  for (const join of collectionJoins) {
    addJoinTable({ ...join, joins })
  }

  return whereConstraint
}
