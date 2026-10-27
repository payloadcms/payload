import type { SQL } from 'drizzle-orm'

import { and, asc, desc, max, sql } from 'drizzle-orm'
import {
  type FindDistinct,
  getFieldByPath,
  getLocalizedPaths,
  resolveBranchQuery,
  resolveBranchReadState,
  rewriteBranchIDs,
  type SanitizedCollectionConfig,
  type Where,
} from 'payload'
import toSnakeCase from 'to-snake-case'

import type { BuildQueryJoinAliases, DrizzleAdapter, GenericColumn } from './types.js'

import { buildBranchVisibility } from './queries/buildBranchVisibility.js'
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
  const branchReadState = resolveBranchReadState({
    branch: args.branch,
    collectionSlug: args.collection,
    req: args.req,
  })
  const branchScopedWhere = branchReadState.useBranching
    ? rewriteBranchIDs(args.where)
    : await resolveBranchQuery({
        branch: args.branch,
        collectionSlug: args.collection,
        req: args.req,
        where: args.where,
      })

  const relatedBranchConstraints: Where[] = []
  const nativeRelatedBranchReads: {
    branch: string
    collectionSlug: string
    relationshipPath: string
  }[] = []
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
    const relatedBranchReadState = resolveBranchReadState({
      branch: args.branch,
      collectionSlug: relatedCollectionSlug,
      req: args.req,
    })
    const relatedWhere = relatedBranchReadState.useBranching
      ? rewriteBranchIDs(args.relatedAccess?.[relationshipPath])
      : await resolveBranchQuery({
          branch: args.branch,
          collectionSlug: relatedCollectionSlug,
          req: args.req,
          where: args.relatedAccess?.[relationshipPath],
        })

    if (relatedBranchReadState.useBranching) {
      nativeRelatedBranchReads.push({
        branch: relatedBranchReadState.branch,
        collectionSlug: relatedCollectionSlug,
        relationshipPath,
      })
    }

    if (relatedWhere && Object.keys(relatedWhere).length) {
      relatedBranchConstraints.push(
        prefixWherePaths({ prefix: relationshipPath, where: relatedWhere }),
      )
    }
  }

  const {
    joins,
    orderBy,
    selectFields,
    where: queryWhere,
  } = buildQuery({
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
  const table = this.tables[tableName]
  const canonicalIDExpression =
    branchReadState.useBranching && args.field === 'id'
      ? sql`COALESCE(${table._branchDocID}, ${table.id})`
      : undefined

  if (canonicalIDExpression) {
    selectFields['_selected'] = canonicalIDExpression.as('_selected') as unknown as GenericColumn
  }

  const branchVisibilityWhere = branchReadState.useBranching
    ? buildBranchVisibility({
        adapter: this,
        branch: branchReadState.branch,
        collectionSlug: args.collection,
        table,
      })
    : undefined
  const relatedBranchVisibility = nativeRelatedBranchReads.flatMap((relatedBranchRead) => {
    const relatedTable = joins.find(({ queryPath }) =>
      queryPath?.endsWith(`${relatedBranchRead.relationshipPath}._target`),
    )?.table

    return relatedTable
      ? [
          buildBranchVisibility({
            adapter: this,
            branch: relatedBranchRead.branch,
            collectionSlug: relatedBranchRead.collectionSlug,
            table: relatedTable,
          }),
        ]
      : []
  })
  const where = and(queryWhere, branchVisibilityWhere, ...relatedBranchVisibility)

  const db = await getTransaction(this, args.req)

  const _order = canonicalIDExpression ? null : getOrderColumn(orderBy, selectFields, joins)
  const firstSort = Array.isArray(args.sort) ? args.sort[0] : args.sort
  const canonicalIDOrder = firstSort?.startsWith('-') ? desc : asc

  const selectDistinctResult = await selectDistinct({
    adapter: this,
    db,
    forceRun: true,
    hasAggregates: Boolean(_order) && !joins.length,
    joins,
    query: ({ query }) => {
      if (canonicalIDExpression) {
        query = query.orderBy(canonicalIDOrder(sql`_selected`))
      } else if (_order && orderBy.length > 0 && !joins.length) {
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
      column: (canonicalIDExpression ?? selectFields['_selected']) as GenericColumn,
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
