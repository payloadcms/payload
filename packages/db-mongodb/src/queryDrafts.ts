import type { PaginateOptions, PipelineStage, QueryOptions } from 'mongoose'
import type { QueryDrafts } from 'payload'

import { buildVersionCollectionFields, combineQueries, flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildQuery } from './queries/buildQuery.js'
import { buildSortParam } from './queries/buildSortParam.js'
import { aggregatePaginate } from './utilities/aggregatePaginate.js'
import { buildJoinAggregation } from './utilities/buildJoinAggregation.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { getCollection } from './utilities/getEntity.js'
import { getSession } from './utilities/getSession.js'
import { transform } from './utilities/transform.js'

export const queryDrafts: QueryDrafts = async function queryDrafts(
  this: MongooseAdapter,
  {
    collection: collectionSlug,
    joins,
    limit,
    locale,
    page,
    pagination,
    req,
    select,
    sort: sortArg,
    where = {},
  },
) {
  const { collectionConfig, Model } = getCollection({
    adapter: this,
    collectionSlug,
    versions: true,
  })

  const options: QueryOptions = {
    session: await getSession(this, req),
  }

  let hasNearConstraint
  let sort

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  const fields = buildVersionCollectionFields(this.payload.config, collectionConfig, true)

  const sortAggregation: PipelineStage[] = []
  if (!hasNearConstraint) {
    sort = buildSortParam({
      adapter: this,
      config: this.payload.config,
      fields,
      locale,
      sort: sortArg || collectionConfig.defaultSort,
      sortAggregation,
      timestamps: true,
      versions: true,
    })
  }

  const combinedWhere = combineQueries({ latest: { equals: true } }, where)

  const versionQuery = await buildQuery({
    adapter: this,
    fields,
    locale,
    where: combinedWhere,
  })

  const projection = buildProjectionFromSelect({
    adapter: this,
    fields,
    select,
  })
  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount =
    hasNearConstraint || !versionQuery || Object.keys(versionQuery).length === 0
  const paginationOptions: PaginateOptions = {
    lean: true,
    leanWithId: true,
    options,
    page,
    pagination,
    projection,
    sort,
    useEstimatedCount,
  }

  if (this.collation) {
    const defaultLocale = 'en'
    paginationOptions.collation = {
      locale: locale && locale !== 'all' && locale !== '*' ? locale : defaultLocale,
      ...this.collation,
    }
  }

  if (
    !useEstimatedCount &&
    Object.keys(versionQuery).length === 0 &&
    this.disableIndexHints !== true
  ) {
    // Improve the performance of the countDocuments query which is used if useEstimatedCount is set to false by adding
    // a hint. By default, if no hint is provided, MongoDB does not use an indexed field to count the returned documents,
    // which makes queries very slow. This only happens when no query (filter) is provided. If one is provided, it uses
    // the correct indexed field
    paginationOptions.useCustomCountFn = () => {
      return Promise.resolve(
        Model.countDocuments(versionQuery, {
          hint: { _id: 1 },
        }),
      )
    }
  }

  if (limit && limit > 0) {
    paginationOptions.limit = limit
    // limit must also be set here, it's ignored when pagination is false

    paginationOptions.options!.limit = limit
  }

  let result

  const aggregate = await buildJoinAggregation({
    adapter: this,
    collection: collectionSlug,
    collectionConfig,
    joins,
    locale,
    projection,
    query: versionQuery,
    versions: true,
  })

  // build join aggregation
  if (aggregate || sortAggregation.length > 0) {
    result = await aggregatePaginate({
      adapter: this,
      collation: paginationOptions.collation,
      joinAggregation: aggregate,
      limit: paginationOptions.limit,
      Model,
      page: paginationOptions.page,
      pagination: paginationOptions.pagination,
      projection: paginationOptions.projection,
      query: versionQuery,
      session: paginationOptions.options?.session ?? undefined,
      sort: paginationOptions.sort as object,
      useEstimatedCount: paginationOptions.useEstimatedCount,
    })
  } else {
    result = await Model.paginate(versionQuery, paginationOptions)
  }

  transform({
    adapter: this,
    data: result.docs,
    fields: buildVersionCollectionFields(this.payload.config, collectionConfig),
    operation: 'read',
  })

  for (let i = 0; i < result.docs.length; i++) {
    const id = result.docs[i].parent
    result.docs[i] = result.docs[i].version
    result.docs[i].id = id
  }

  return result
}
