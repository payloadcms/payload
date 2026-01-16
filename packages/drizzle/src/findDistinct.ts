import { max, sql } from 'drizzle-orm'
import { type FindDistinct, getFieldByPath, type SanitizedCollectionConfig } from 'payload'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { getTransaction } from './utilities/getTransaction.js'
import { DistinctSymbol } from './utilities/rawConstraint.js'

export const findDistinct: FindDistinct = async function (this: DrizzleAdapter, args) {
  const collectionConfig: SanitizedCollectionConfig =
    this.payload.collections[args.collection].config
  const page = args.page || 1
  const offset = args.limit ? (page - 1) * args.limit : undefined
  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  const { joins, orderBy, selectFields, where } = buildQuery({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    locale: args.locale,
    sort: args.sort ?? args.field,
    tableName,
    where: {
      and: [
        args.where ?? {},
        {
          [args.field]: {
            equals: DistinctSymbol,
          },
        },
      ],
    },
  })

  orderBy.pop()

  const db = await getTransaction(this, args.req)

  const _order =
    orderBy[0].column === selectFields['_selected'] ? null : max(orderBy[0]?.column).as('_order')

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    db,
    forceRun: true,
    hasAggregates: Boolean(_order),
    joins,
    query: ({ query }) => {
      if (_order) {
        query = query.orderBy(orderBy[0].order(sql`_order`))
      } else {
        query = query.orderBy(() => orderBy.map(({ column, order }) => order(column)))
      }

      if (args.limit) {
        if (offset) {
          query = query.offset(offset)
        }

        query = query.limit(args.limit)
      }

      return query
    },
    selectFields: {
      _selected: selectFields['_selected'],
      ...(_order ? { _order } : {}),
    } as Record<string, any>,
    tableName,
    where,
  })

  const field = getFieldByPath({
    config: this.payload.config,
    fields: collectionConfig.flattenedFields,
    includeRelationships: true,
    path: args.field,
  })?.field

  if (field && 'relationTo' in field && Array.isArray(field.relationTo)) {
    for (const row of selectDistinctResult as any) {
      const json = JSON.parse(row._selected)
      const relationTo = Object.keys(json).find((each) => Boolean(json[each]))
      const value = json[relationTo]

      if (!value) {
        row._selected = null
      } else {
        row._selected = { relationTo, value }
      }
    }
  }

  const values = selectDistinctResult.map((each) => ({
    [args.field]: (each as Record<string, any>)._selected,
  }))

  if (args.limit) {
    const totalDocs = await this.countDistinct({
      column: selectFields['_selected'],
      db,
      joins,
      tableName,
      where,
    })

    const totalPages = Math.ceil(totalDocs / args.limit)
    const hasPrevPage = page > 1
    const hasNextPage = totalPages > page
    const pagingCounter = (page - 1) * args.limit + 1

    return {
      hasNextPage,
      hasPrevPage,
      limit: args.limit,
      nextPage: hasNextPage ? page + 1 : null,
      page,
      pagingCounter,
      prevPage: hasPrevPage ? page - 1 : null,
      totalDocs,
      totalPages,
      values,
    }
  }

  return {
    hasNextPage: false,
    hasPrevPage: false,
    limit: 0,
    page: 1,
    pagingCounter: 1,
    totalDocs: values.length,
    totalPages: 1,
    values,
  }
}
