import type { ClientSession, CollationOptions, Collection, Document } from 'mongodb'
import type { PipelineStage } from 'mongoose'
import type { PaginatedDocs } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { countDocuments } from './countDocuments.js'

export const findMany = async ({
  adapter,
  collation,
  collection,
  joinAggregation,
  limit,
  page = 1,
  pagination,
  projection,
  query = {},
  queryAggregation,
  session,
  skip,
  sort,
  useEstimatedCount,
}: {
  adapter: MongooseAdapter
  collation?: CollationOptions
  collection: Collection
  joinAggregation?: PipelineStage[]
  limit?: number
  page?: number
  pagination?: boolean
  projection?: Record<string, unknown>
  query?: Record<string, unknown>
  queryAggregation?: PipelineStage[]
  session?: ClientSession
  skip?: number
  sort?: Record<string, -1 | 1>
  useEstimatedCount?: boolean
}): Promise<PaginatedDocs> => {
  if (!skip) {
    skip = (page - 1) * (limit ?? 0)
  }

  let docsPromise: Promise<Document[]>
  let countPromise: Promise<null | number> = Promise.resolve(null)

  if (joinAggregation?.length || queryAggregation?.length) {
    const aggregation = collection.aggregate([], { collation, session })

    // We need to add query aggregation stages _before_ $match to load relationships first
    if (queryAggregation) {
      for (const stage of queryAggregation) {
        aggregation.addStage(stage)
      }
    }

    aggregation.match(query)

    if (sort) {
      aggregation.sort(sort)
    }

    if (skip) {
      aggregation.skip(skip)
    }

    if (limit) {
      aggregation.limit(limit)
    }

    if (joinAggregation) {
      for (const stage of joinAggregation) {
        aggregation.addStage(stage)
      }
    }

    if (projection) {
      aggregation.project(projection)
    }

    docsPromise = aggregation.toArray()
  } else {
    docsPromise = collection
      .find(query, {
        collation,
        limit,
        projection,
        session,
        skip,
        sort,
      })
      .toArray()
  }

  if (pagination !== false && limit) {
    countPromise = countDocuments({
      adapter,
      collation,
      collection,
      query,
      queryAggregation,
      session,
      useEstimatedCount,
    })
  }

  const [docs, countResult] = await Promise.all([docsPromise, countPromise])

  const count = countResult === null ? docs.length : countResult

  const totalPages =
    pagination !== false && typeof limit === 'number' && limit !== 0 ? Math.ceil(count / limit) : 1

  const hasPrevPage = pagination !== false && page > 1
  const hasNextPage = pagination !== false && totalPages > page
  const pagingCounter =
    pagination !== false && typeof limit === 'number' ? (page - 1) * limit + 1 : 1

  const result = {
    docs,
    hasNextPage,
    hasPrevPage,
    limit,
    nextPage: hasNextPage ? page + 1 : null,
    page,
    pagingCounter,
    prevPage: hasPrevPage ? page - 1 : null,
    totalDocs: count,
    totalPages,
  } as PaginatedDocs<Record<string, unknown>>

  return result
}
