import type { SQL } from 'drizzle-orm'
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { Field, Where } from 'payload/types'

import { asc, desc } from 'drizzle-orm'

import type { GenericColumn, GenericTable, PostgresAdapter } from '../types.js'

import { getTableColumnFromPath } from './getTableColumnFromPath.js'
import { parseParams } from './parseParams.js'

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
  }[]
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

  let orderBy: Result['orderBy'] = []

  if (sort) {
    orderBy = sort
      .split(',')
      .map((sortString) => {
        const sortPath = sortString.replace(/^-/, '')
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
          return {
            column: sortTable?.[sortTableColumnName] ?? null,
            order: sortString[0] === '-' ? desc : asc,
          }
        } catch (err) {
          // continue
        }
      })
      .filter((sortInfo) => !!sortInfo)
  }

  if (!orderBy.length) {
    const firstOrderBy = {
      column: null,
      order: null,
    }
    firstOrderBy.order = desc
    const createdAt = adapter.tables[tableName]?.createdAt

    if (createdAt) {
      firstOrderBy.column = createdAt
    } else {
      firstOrderBy.column = adapter.tables[tableName].id
    }

    orderBy = [firstOrderBy]
  }

  if (orderBy.length) {
    selectFields.sort = orderBy[0].column
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
