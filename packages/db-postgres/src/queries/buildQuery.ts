import type { SQL } from 'drizzle-orm'
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { Field, Where } from 'payload/types'

import { asc, desc } from 'drizzle-orm'

import type { GenericColumn, GenericTable, PostgresAdapter } from '../types'

import { getTableColumnFromPath } from './getTableColumnFromPath'
import { parseParams } from './parseParams'

export type BuildQueryJoins = Record<string, SQL>

export type BuildQueryJoinAliases = {
  condition: SQL
  table: GenericTable | PgTableWithColumns<any>
}[]

type BuildQueryArgs = {
  adapter: PostgresAdapter
  fields: Field[]
  locale?: string
  sort?: string
  tableName: string
  where: Where
}

type Result = {
  joinAliases: BuildQueryJoinAliases
  joins: BuildQueryJoins
  orderBy: {
    column: GenericColumn
    order: typeof asc | typeof desc
  }
  selectFields: Record<string, GenericColumn>
  where: SQL
}
const buildQuery = async function buildQuery({
  adapter,
  fields,
  locale,
  sort,
  tableName,
  where: incomingWhere,
}: BuildQueryArgs): Promise<Result> {
  const selectFields: Record<string, GenericColumn> = {
    id: adapter.tables[tableName].id,
  }
  const joins: BuildQueryJoins = {}
  const joinAliases: BuildQueryJoinAliases = []

  const orderBy: Result['orderBy'] = {
    column: null,
    order: null,
  }

  if (sort) {
    let sortPath

    if (sort[0] === '-') {
      sortPath = sort.substring(1)
      orderBy.order = desc
    } else {
      sortPath = sort
      orderBy.order = asc
    }

    try {
      const { columnName: sortTableColumnName, table: sortTable } = getTableColumnFromPath({
        adapter,
        collectionPath: sortPath,
        fields,
        joinAliases,
        joins,
        locale,
        pathSegments: sortPath.replace(/__/g, '.').split('.'),
        selectFields,
        tableName,
        value: sortPath,
      })
      orderBy.column = sortTable?.[sortTableColumnName]
    } catch (err) {
      // continue
    }
  }

  if (!orderBy?.column) {
    orderBy.order = desc
    const createdAt = adapter.tables[tableName]?.createdAt

    if (createdAt) {
      orderBy.column = createdAt
    } else {
      orderBy.column = adapter.tables[tableName].id
    }
  }

  if (orderBy.column) {
    selectFields.sort = orderBy.column
  }

  let where: SQL

  if (incomingWhere && Object.keys(incomingWhere).length > 0) {
    where = await parseParams({
      adapter,
      fields,
      joinAliases,
      joins,
      locale,
      selectFields,
      tableName,
      where: incomingWhere,
    })
  }

  return {
    joinAliases,
    joins,
    orderBy,
    selectFields,
    where,
  }
}

export default buildQuery
