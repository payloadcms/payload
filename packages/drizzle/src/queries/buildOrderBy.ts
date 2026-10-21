import type { SQL, Table } from 'drizzle-orm'
import type { FlattenedField, Sort } from 'payload'

import { asc, desc, max, min, sql } from 'drizzle-orm'

import type { ProjectionQueryAdapter } from '../branching/createProjectionQueries.js'
import type { DrizzleAdapter, GenericColumn } from '../types.js'
import type { BuildQueryJoinAliases, BuildQueryResult } from './buildQuery.js'

import { projectionQueryContext } from '../branching/createProjectionQueries.js'
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
      const isProjectionQuery = Boolean((adapter as ProjectionQueryAdapter)[projectionQueryContext])
      const {
        columnName: sortTableColumnName,
        columns,
        rawColumn,
        table: sortTable,
      } = getTableColumnFromPath({
        adapter,
        collectionPath: sortProperty,
        fields,
        joins,
        locale,
        parentIsLocalized,
        pathSegments: sortProperty.replace(/__/g, '.').split('.'),
        selectFields,
        tableName,
        value: isProjectionQuery ? undefined : sortProperty,
      })
      const order = sortDirection === 'asc' ? asc : desc

      if (isProjectionQuery && columns?.length) {
        const aggregate = sortDirection === 'asc' ? min : max
        const numberColumns = columns
          .filter(({ idType }) => idType === 'number')
          .map(({ rawColumn }) => rawColumn)
        const textColumns = columns
          .filter(({ idType }) => idType !== 'number')
          .map(({ rawColumn }) => sql`cast(${rawColumn} as text)`)
        const coalesce = ({ isNumber = false, values }: { isNumber?: boolean; values: SQL[] }) =>
          values.length === 0
            ? isNumber
              ? sql`cast(null as numeric)`
              : sql`cast(null as text)`
            : values.length === 1
              ? values[0]
              : sql`coalesce(${sql.join(values, sql`, `)})`
        const numberValue = coalesce({ isNumber: true, values: numberColumns })
        const textValue = coalesce({ values: textColumns })
        const rank = sql`case when ${numberValue} is not null then 0 when ${textValue} is not null then 1 else null end`
        const rankAggregate = aggregate(rank)

        orderBy.push(
          { column: rank as any, order, projectionAggregate: rankAggregate },
          {
            column: numberValue as any,
            order,
            projectionAggregate: sql`case when ${rankAggregate} = 0 then ${aggregate(numberValue)} else null end`,
          },
          {
            column: textValue as any,
            order,
            projectionAggregate: sql`case when ${rankAggregate} = 1 then ${aggregate(textValue)} else null end`,
          },
        )
        continue
      }

      if (isProjectionQuery && rawColumn) {
        orderBy.push({
          column: rawColumn as any,
          order,
          projectionAggregate: (sortDirection === 'asc' ? min : max)(rawColumn),
        })
        continue
      }

      if (sortTable?.[sortTableColumnName]) {
        let order = sortDirection === 'asc' ? asc : desc

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
