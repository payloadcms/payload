import type { CollationOptions } from 'mongodb'
import type { ClientSession, Model, PipelineStage } from 'mongoose'
import type { PaginatedDocs } from 'payload'

import type { MongooseAdapter } from '../index.js'

export const aggregatePaginate = async ({
  adapter,
  collation,
  joinAggregation,
  limit,
  Model,
  page,
  pagination,
  projection,
  query,
  session,
  sort,
  sortAggregation,
  useEstimatedCount,
}: {
  adapter: MongooseAdapter
  collation?: CollationOptions
  joinAggregation?: PipelineStage[]
  limit?: number
  Model: Model<any>
  page?: number
  pagination?: boolean
  projection?: Record<string, boolean>
  query: Record<string, unknown>
  session?: ClientSession
  sort?: object
  sortAggregation?: PipelineStage[]
  useEstimatedCount?: boolean
}): Promise<PaginatedDocs<any>> => {
  const aggregation: PipelineStage[] = [{ $match: query }]

  if (sortAggregation && sortAggregation.length > 0) {
    for (const stage of sortAggregation) {
      aggregation.push(stage)
    }
  }

  if (sort) {
    const $sort: Record<string, -1 | 1> = {}

    Object.entries(sort).forEach(([key, value]) => {
      $sort[key] = value === 'desc' ? -1 : 1
    })

    aggregation.push({ $sort })
  }

  if (page) {
    aggregation.push({ $skip: (page - 1) * (limit ?? 0) })
  }

  if (limit) {
    aggregation.push({ $limit: limit })
  }

  if (joinAggregation) {
    for (const stage of joinAggregation) {
      aggregation.push(stage)
    }
  }

  if (projection) {
    aggregation.push({ $project: projection })
  }

  let countPromise: Promise<null | number> = Promise.resolve(null)

  if (pagination !== false && limit) {
    if (useEstimatedCount) {
      countPromise = Model.estimatedDocumentCount(query)
    } else {
      const hint = adapter.disableIndexHints !== true ? { _id: 1 } : undefined
      countPromise = Model.countDocuments(query, { collation, hint, session })
    }
  }

  const [docs, countResult] = await Promise.all([
    Model.aggregate(aggregation, { collation, session }),
    countPromise,
  ])

  const count = countResult === null ? docs.length : countResult

  const totalPages =
    pagination !== false && typeof limit === 'number' && limit !== 0 ? Math.ceil(count / limit) : 1

  const hasPrevPage = typeof page === 'number' && pagination !== false && page > 1
  const hasNextPage = typeof page === 'number' && pagination !== false && totalPages > page
  const pagingCounter =
    typeof page === 'number' && pagination !== false && typeof limit === 'number'
      ? (page - 1) * limit + 1
      : 1

  const result: PaginatedDocs = {
    docs,
    hasNextPage,
    hasPrevPage,
    limit: limit ?? 0,
    nextPage: hasNextPage ? page + 1 : null,
    page,
    pagingCounter,
    prevPage: hasPrevPage ? page - 1 : null,
    totalDocs: count,
    totalPages,
  }

  return result
}
