import type { asc, desc, SQL } from 'drizzle-orm'
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { Field, Where } from 'payload'

import type { DrizzleAdapter, GenericColumn, GenericTable } from '../types.js'

import { buildOrderBy } from './buildOrderBy.js'
import { parseParams } from './parseParams.js'

export type BuildQueryJoinAliases = {
  condition: SQL
  table: GenericTable | PgTableWithColumns<any>
  type?: 'innerJoin' | 'leftJoin' | 'rightJoin'
}[]

type BuildQueryArgs = {
  adapter: DrizzleAdapter
  fields: Field[]
  joins?: BuildQueryJoinAliases
  locale?: string
  sort?: string
  tableName: string
  where: Where
}

export type BuildQueryResult = {
  joins: BuildQueryJoinAliases
  orderBy: {
    column: GenericColumn
    order: typeof asc | typeof desc
  }
  selectFields: Record<string, GenericColumn>
  where: SQL
}
const buildQuery = function buildQuery({
  adapter,
  fields,
  joins = [],
  locale,
  sort,
  tableName,
  where: incomingWhere,
}: BuildQueryArgs): BuildQueryResult {
  const selectFields: Record<string, GenericColumn> = {
    id: adapter.tables[tableName].id,
  }

  const orderBy = buildOrderBy({
    adapter,
    fields,
    joins,
    locale,
    selectFields,
    sort,
    tableName,
  })

  let where: SQL

  if (incomingWhere && Object.keys(incomingWhere).length > 0) {
    where = parseParams({
      adapter,
      fields,
      joins,
      locale,
      selectFields,
      tableName,
      where: incomingWhere,
    })
  }

  return {
    joins,
    orderBy,
    selectFields,
    where,
  }
}

export default buildQuery
