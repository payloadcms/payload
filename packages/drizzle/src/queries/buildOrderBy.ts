import type { AnyColumn, SQL, SQLWrapper, Table } from 'drizzle-orm'
import type { FlattenedField, Sort } from 'payload'

import { asc, desc, sql } from 'drizzle-orm'

import type { DrizzleAdapter, GenericColumn } from '../types.js'
import type { BuildQueryJoinAliases, BuildQueryResult } from './buildQuery.js'

import { getNameFromDrizzleTable } from '../utilities/getNameFromDrizzleTable.js'
import { getTableColumnFromPath } from './getTableColumnFromPath.js'

type Args = {
  adapter: DrizzleAdapter
  aliasTable?: Table
  fields: FlattenedField[]
  joins: BuildQueryJoinAliases
  locale?: string
  parentIsLocalized: boolean
  rawSort?: SQL
  selectFields: Record<string, GenericColumn>
  sort?: Sort
  tableName: string
}

/**
 * Postgres sorts NULL first in a descending sort, while MongoDB and SQLite sort it last.
 * Postgres can't use a plain index for this order, so it's only for columns that can hold NULL.
 */
export const descNullsLast = (column: AnyColumn | SQLWrapper): SQL =>
  sql`${desc(column)} nulls last`

/**
 * Gets the order by column and direction constructed from the sort argument adds the column to the select fields and joins if necessary
 */
export const buildOrderBy = ({
  adapter,
  aliasTable,
  fields,
  joins,
  locale,
  parentIsLocalized,
  rawSort,
  selectFields,
  sort,
  tableName,
}: Args): BuildQueryResult['orderBy'] => {
  const orderBy: BuildQueryResult['orderBy'] = []

  const createdAt = adapter.tables[tableName]?.createdAt

  if (!sort) {
    if (createdAt) {
      sort = '-createdAt'
    } else {
      sort = '-id'
    }
  }

  if (typeof sort === 'string') {
    sort = [sort]
  }

  // In the case of Mongo, when sorting by a field that is not unique, the results are not guaranteed to be in the same order each time.
  // So we add a fallback sort to ensure that the results are always in the same order.
  let fallbackSort = '-id'

  if (createdAt) {
    fallbackSort = '-createdAt'
  }

  if (!(sort.includes(fallbackSort) || sort.includes(fallbackSort.replace('-', '')))) {
    sort.push(fallbackSort)
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
        parentIsLocalized,
        pathSegments: sortProperty.replace(/__/g, '.').split('.'),
        selectFields,
        tableName,
        value: sortProperty,
      })
      if (sortTable?.[sortTableColumnName]) {
        // A left join can give a NOT NULL column NULLs, so only trust `notNull` on this table
        const canBeNull =
          !sortTable[sortTableColumnName].notNull ||
          getNameFromDrizzleTable(sortTable) !== tableName

        let order = desc

        if (sortDirection === 'asc') {
          order = asc
        } else if (adapter.name === 'postgres' && canBeNull) {
          order = descNullsLast
        }

        if (rawSort) {
          order = () => rawSort
        }

        orderBy.push({
          column:
            aliasTable && tableName === getNameFromDrizzleTable(sortTable)
              ? aliasTable[sortTableColumnName]
              : sortTable[sortTableColumnName],
          order,
        })

        // Only add to selectFields if not already present (avoid duplicates from getTableColumnFromPath)
        const columnToAdd = sortTable[sortTableColumnName]
        const alreadyExists = Object.values(selectFields).some((col) => col === columnToAdd)
        if (!alreadyExists) {
          selectFields[sortTableColumnName] = columnToAdd
        }
      }
    } catch (_) {
      // continue
    }
  }

  return orderBy
}
