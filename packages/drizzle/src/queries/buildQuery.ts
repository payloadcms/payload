import type { asc, desc, SQL, Table } from 'drizzle-orm'
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { FlattenedField, Sort, Where } from 'payload'

import { and } from 'drizzle-orm'

import type { ProjectionQueryAdapter } from '../branching/createProjectionQueries.js'
import type { DrizzleAdapter, GenericColumn, GenericTable } from '../types.js'
import type { QueryContext } from './parseParams.js'

import { projectionQueryContext } from '../branching/createProjectionQueries.js'
import {
  getProjectionCollection,
  guardProjectionJoins,
  projectionRootConstraint,
} from '../branching/projectionConstraints.js'
import { buildOrderBy } from './buildOrderBy.js'
import { parseParams } from './parseParams.js'

export type BuildQueryJoinAliases = {
  condition: SQL
  // with parent
  isOneToMany?: boolean
  queryPath?: string
  table: GenericTable | PgTableWithColumns<any>
  type?: 'innerJoin' | 'leftJoin' | 'rightJoin'
}[]

type BuildQueryArgs = {
  adapter: DrizzleAdapter
  aliasTable?: Table
  fields: FlattenedField[]
  joins?: BuildQueryJoinAliases
  locale?: string
  parentIsLocalized?: boolean
  selectLocale?: boolean
  sort?: Sort
  tableName: string
  where: Where
}

export type BuildQueryResult = {
  joins: BuildQueryJoinAliases
  orderBy: {
    column: GenericColumn
    order: typeof asc | typeof desc
    /** Aggregate over one-to-many rows without mixing polymorphic ID type domains. */
    projectionAggregate?: SQL
  }[]
  selectFields: Record<string, GenericColumn>
  where: SQL
}

export const buildQuery = function buildQuery({
  adapter,
  aliasTable,
  fields,
  joins = [],
  locale,
  parentIsLocalized,
  selectLocale,
  sort,
  tableName,
  where: incomingWhere,
}: BuildQueryArgs): BuildQueryResult {
  // Nested projection queries use this alias as their driving relation. Field
  // traversal also reads the table registry when adding localized/array joins.
  if (aliasTable && (adapter as ProjectionQueryAdapter)[projectionQueryContext]) {
    adapter = Object.assign(Object.create(adapter), {
      tables: { ...adapter.tables, [tableName]: aliasTable },
    }) as DrizzleAdapter
  }

  const selectFields: Record<string, GenericColumn> = {
    id: adapter.tables[tableName].id,
  }

  let where: SQL

  const context: QueryContext = { sort }
  if (incomingWhere && Object.keys(incomingWhere).length > 0) {
    where = parseParams({
      adapter,
      aliasTable,
      context,
      fields,
      joins,
      locale,
      parentIsLocalized,
      selectFields,
      selectLocale,
      tableName,
      where: incomingWhere,
    })
  }

  const orderBy = buildOrderBy({
    adapter,
    aliasTable,
    fields,
    joins,
    locale,
    parentIsLocalized,
    rawSort: context.rawSort,
    selectFields,
    sort: context.sort,
    tableName,
  })

  guardProjectionJoins({ adapter, joins, locale })

  const projectionCollection = getProjectionCollection({
    adapter,
    table: aliasTable ?? adapter.tables[tableName],
  })

  if (projectionCollection) {
    where = and(
      where,
      projectionRootConstraint({
        adapter,
        collection: projectionCollection,
        joins,
        locale,
        table: aliasTable ?? adapter.tables[tableName],
      }),
    )
  }

  return {
    joins,
    orderBy,
    selectFields,
    where,
  }
}
