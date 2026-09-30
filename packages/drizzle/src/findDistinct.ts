import type { asc, desc, SQL } from 'drizzle-orm'

import { max, sql } from 'drizzle-orm'
import {
  type FindDistinct,
  getFieldByPath,
  getLocalizedPaths,
  resolveBranchQuery,
  type SanitizedCollectionConfig,
  type Where,
} from 'payload'
import toSnakeCase from 'to-snake-case'

import type { BuildQueryJoinAliases, DrizzleAdapter, GenericColumn } from './types.js'

import { buildQuery } from './queries/buildQuery.js'
import { selectDistinct } from './queries/selectDistinct.js'
import { getTransaction } from './utilities/getTransaction.js'
import { DistinctSymbol } from './utilities/rawConstraint.js'

const prefixWherePaths = ({ prefix, where }: { prefix: string; where: Where }): Where => {
  const prefixedWhere: Where = {}

  for (const [key, value] of Object.entries(where)) {
    if (['and', 'or'].includes(key.toLowerCase()) && Array.isArray(value)) {
      prefixedWhere[key] = value.map((nestedWhere) =>
        prefixWherePaths({ prefix, where: nestedWhere }),
      )
    } else {
      prefixedWhere[`${prefix}.${key}`] = value
    }
  }

  return prefixedWhere
}

const getOrderColumn = (
  orderBy: { column: GenericColumn; order: typeof asc | typeof desc }[],
  selectFields: Record<string, GenericColumn>,
  joins: BuildQueryJoinAliases,
): GenericColumn | null | SQL.Aliased => {
  if (orderBy.length === 0) {
    return null
  }

  if (orderBy[0].column === selectFields['_selected']) {
    return null
  }

  if (joins.length > 0) {
    return orderBy[0].column
  }

  return max(orderBy[0]?.column).as('_order')
}

export const findDistinct: FindDistinct = async function (this: DrizzleAdapter, args) {
  const collectionConfig: SanitizedCollectionConfig =
    this.payload.collections[args.collection].config
  const page = args.page || 1
  const offset = args.limit ? (page - 1) * args.limit : undefined
  const tableName = this.tableNameMap.get(toSnakeCase(collectionConfig.slug))

  // Same predicate a list read gets: distinct values describe the visible documents.
  const branchScopedWhere = await resolveBranchQuery({
    branch: args.branch,
    collectionSlug: args.collection,
    req: args.req,
    where: args.where,
  })

  const relatedBranchConstraints: Where[] = []
  const fieldPaths = getLocalizedPaths({
    collectionSlug: args.collection,
    fields: collectionConfig.flattenedFields,
    incomingPath: args.field,
    locale: args.locale,
    overrideAccess: true,
    payload: this.payload,
  })

  for (let pathIndex = 1; pathIndex < fieldPaths.length; pathIndex++) {
    const relatedCollectionSlug = fieldPaths[pathIndex]?.collectionSlug

    if (!relatedCollectionSlug) {
      continue
    }

    const relationshipPath = fieldPaths
      .slice(0, pathIndex)
      .map(({ path }) => path)
      .join('.')
    const relatedWhere = await resolveBranchQuery({
      branch: args.branch,
      collectionSlug: relatedCollectionSlug,
      req: args.req,
      where: args.relatedAccess?.[relationshipPath],
    })

    if (relatedWhere && Object.keys(relatedWhere).length) {
      relatedBranchConstraints.push(
        prefixWherePaths({ prefix: relationshipPath, where: relatedWhere }),
      )
    }
  }

  const { joins, orderBy, selectFields, where } = buildQuery({
    adapter: this,
    fields: collectionConfig.flattenedFields,
    locale: args.locale,
    sort: args.sort ?? args.field,
    tableName,
    where: {
      and: [
        {
          [args.field]: {
            equals: DistinctSymbol,
          },
        },
        branchScopedWhere ?? {},
        ...relatedBranchConstraints,
      ],
    },
  })

  orderBy.pop()

  const db = await getTransaction(this, args.req)

  const _order = getOrderColumn(orderBy, selectFields, joins)

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    db,
    forceRun: true,
    hasAggregates: Boolean(_order) && !joins.length,
    joins,
    query: ({ query }) => {
      if (_order && orderBy.length > 0 && !joins.length) {
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
