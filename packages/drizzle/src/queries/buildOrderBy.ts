import type { Field, Sort } from 'payload'

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
  sort?: Sort
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
  const orderBy: BuildQueryResult['orderBy'] = []

  if (!sort) {
    const createdAt = adapter.tables[tableName]?.createdAt
    if (createdAt) {
      sort = '-createdAt'
    } else {
      sort = '-id'
    }
  }

  if (typeof sort === 'string') {
    sort = [sort]
  }

  for (const sortItem of sort) {
    let sortProperty: string
    let sortDirection: 'asc' | 'desc'
    if (sortItem[0] === '-') {
      sortProperty = sortItem.substring(1)
      sortDirection = 'desc'
    } else {
      sortProperty = sortItem
      sortDirection = 'asc'
    }
    try {
      const { columnName: sortTableColumnName, table: sortTable } = getTableColumnFromPath({
        adapter,
        collectionPath: sortProperty,
        fields,
        joins,
        locale,
        pathSegments: sortProperty.replace(/__/g, '.').split('.'),
        selectFields,
        tableName,
        value: sortProperty,
      })
      if (sortTable?.[sortTableColumnName]) {
        orderBy.push({
          column: sortTable[sortTableColumnName],
          order: sortDirection === 'asc' ? asc : desc,
        })

        selectFields[sortTableColumnName] = sortTable[sortTableColumnName]
      }
    } catch (err) {
      // continue
    }
  }

  return orderBy
}
