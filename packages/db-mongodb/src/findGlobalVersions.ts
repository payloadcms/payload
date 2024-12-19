import type { CountOptions } from 'mongodb'
import type {
  AggregatePaginateResult,
  PaginateOptions,
  PipelineStage,
  QueryOptions,
} from 'mongoose'
import type { FindGlobalVersions, PayloadRequest } from 'payload'

import { buildVersionGlobalFields, flattenWhereToOperators } from 'payload'

import type { MongooseAdapter } from './index.js'

import { buildSortParam } from './queries/buildSortParam.js'
import { buildProjectionFromSelect } from './utilities/buildProjectionFromSelect.js'
import { mergeProjections } from './utilities/mergeProjections.js'
import { sanitizeInternalFields } from './utilities/sanitizeInternalFields.js'
import { withSession } from './withSession.js'

export const findGlobalVersions: FindGlobalVersions = async function findGlobalVersions(
  this: MongooseAdapter,
  {
    global,
    limit,
    locale,
    page,
    pagination,
    req = {} as PayloadRequest,
    select,
    skip,
    sort: sortArg,
    where,
  },
) {
  const Model = this.versions[global]
  const versionFields = buildVersionGlobalFields(
    this.payload.config,
    this.payload.globals.config.find(({ slug }) => slug === global),
    true,
  )
  const options: QueryOptions = {
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
      fields: versionFields,
      locale,
      sort: sortArg || '-updatedAt',
      timestamps: true,
    })
  }

  const pipeline: PipelineStage[] = []
  const queryProjection: Record<string, boolean> = {}

  const query = await Model.buildQuery({
    globalSlug: global,
    locale,
    payload: this.payload,
    pipeline,
    projection: queryProjection,
    session: options.session,
    where,
  })

  // useEstimatedCount is faster, but not accurate, as it ignores any filters. It is thus set to true if there are no filters.
  const useEstimatedCount = hasNearConstraint || !query || Object.keys(query).length === 0
  const paginationOptions: PaginateOptions = {
    lean: true,
    leanWithId: true,
    limit,
    options,
    page,
    pagination,
    projection: mergeProjections({
      queryProjection,
      selectProjection: buildProjectionFromSelect({ adapter: this, fields: versionFields, select }),
    }),
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
          ...(options as CountOptions),
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

    if (Object.keys(queryProjection).length > 0) {
      pipeline.push({ $project: queryProjection })
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
