import type { Field } from 'payload'

import { asc, desc } from 'drizzle-orm'

import type { DrizzleAdapter, GenericColumn } from '../types.js'
import type { BuildQueryJoinAliases, BuildQueryResult } from './buildQuery.js'

import { getTableColumnFromPath } from './getTableColumnFromPath.js'

type Args = {
  adapter: DrizzleAdapter
  fields: Field[]
  joins: BuildQueryJoinAliases
  locale?: string
  selectFields: Record<string, GenericColumn>
  sort?: string
  tableName: string
}

/**
 * Gets the order by column and direction constructed from the sort argument adds the column to the select fields and joins if necessary
 */
export const buildOrderBy = ({
  adapter,
  fields,
  joins,
  locale,
  selectFields,
  sort,
  tableName,
}: Args): BuildQueryResult['orderBy'] => {
  const orderBy: BuildQueryResult['orderBy'] = {
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
        joins,
        locale,
        pathSegments: sortPath.replace(/__/g, '.').split('.'),
        selectFields,
        tableName,
        useAlias: true,
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

  return orderBy
}
