import type { AggregatePaginateResult, PaginateOptions, PipelineStage } from 'mongoose'
import type { FindVersions, PayloadRequest } from 'payload'

import { flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildSortParam } from './queries/buildSortParam.js'
import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const findVersions: FindVersions = async function findVersions(
  this: MongooseAdapter,
  {
    collection,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequest,
    skip,
    sort: sortArg,
    where,
  },
) {
  const Model = this.versions[collection]
  const collectionConfig = this.payload.collections[collection].config
  const options = {
    ...(await withSession(this, req)),
    limit,
    skip,
  }

  let hasNearConstraint = false

  if (where) {
    const constraints = flattenWhereToOperators(where)
    hasNearConstraint = constraints.some((prop) => Object.keys(prop).some((key) => key === 'near'))
  }

  let sort
  if (!hasNearConstraint) {
    sort = buildSortParam({
      config: this.payload.config,
      fields: collectionConfig.fields,
      locale,
      sort: sortArg || '-updatedAt',
      timestamps: true,
    })
  }

  const pipeline: PipelineStage[] = []
  const projection: Record<string, boolean> = {}

  const query = Model.buildQuery({
    locale,
    payload: this.payload,
    pipeline,
    projection,
    where,
  })

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0
  const paginationOptions: PaginateOptions = {
    forceCountFn: hasNearConstraint,
    lean: true,
    leanWithId: true,
    limit,
    options,
    page,
    pagination,
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

  if (!useEstimatedCount && Object.keys(query).length === 0 && this.disableIndexHints !== true) {
    // Improve the performance of the countDocuments query which is used if useEstimatedCount is set to false by adding
    // a hint. By default, if no hint is provided, MongoDB does not use an indexed field to count the returned documents,
    // which makes queries very slow. This only happens when no query (filter) is provided. If one is provided, it uses
    // the correct indexed field
    paginationOptions.useCustomCountFn = () => {
      return Promise.resolve(
        Model.countDocuments(query, {
          ...options,
          hint: { _id: 1 },
        }),
      )
    }
  }

  if (limit >= 0) {
    paginationOptions.limit = limit
    // limit must also be set here, it's ignored when pagination is false
    paginationOptions.options.limit = limit

    // Disable pagination if limit is 0
    if (limit === 0) {
      paginationOptions.pagination = false
    }
  }

  let result: AggregatePaginateResult<unknown>

  if (pipeline.length) {
    pipeline.push({ $sort: { createdAt: -1 } })

    if (limit) {
      pipeline.push({ $limit: limit })
    }

    if (Object.keys(projection).length > 0) {
      pipeline.push({ $project: projection })
    }

    result = await Model.aggregatePaginate(Model.aggregate(pipeline), paginationOptions)
  } else {
    result = await Model.paginate(query, paginationOptions)
  }

  const docs = JSON.parse(JSON.stringify(result.docs))

  return {
    ...result,
    docs: docs.map((doc) => {
      doc.id = doc._id
      return sanitizeInternalFields(doc)
    }),
  }
}
