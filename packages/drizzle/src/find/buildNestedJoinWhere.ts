import type { Where } from 'payload'

import { getTableName } from 'drizzle-orm'

import type { BuildQueryJoinAliases } from '../queries/buildQuery.js'
import type { DrizzleAdapter, GenericTable } from '../types.js'

import { addJoinTable } from '../queries/addJoinTable.js'
import { buildQuery } from '../queries/buildQuery.js'

export function buildNestedJoinWhere({
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
  const nestedJoins: BuildQueryJoinAliases = []
  const query = buildQuery({
    adapter,
    fields: adapter.payload.collections[collection].config.flattenedFields,
    joins: nestedJoins,
    locale,
    tableName: getTableName(table),
    where,
  })

  for (const join of nestedJoins) {
    addJoinTable({ ...join, joins })
  }

  return query.where
}
