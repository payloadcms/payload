import type { asc, desc, SQL, Table } from 'drizzle-orm'
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { FlattenedField, Sort, Where } from '@ruya.sa/payload'

import type { DrizzleAdapter, GenericColumn, GenericTable } from '../types.js'
import type { QueryContext } from './parseParams.js'

import { buildOrderBy } from './buildOrderBy.js'
import { parseParams } from './parseParams.js'

export type BuildQueryJoinAliases = {
  condition: SQL
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

  return {
    joins,
    orderBy,
    selectFields,
    where,
  }
}
