import type { ClientSession, CollationOptions, Collection, Document } from 'mongodb'
import type { PipelineStage } from 'mongoose'
import type { PaginatedDocs } from 'payload'

import type { MongooseAdapter } from '../index.js'

export const findMany = async ({
  adapter,
  collation,
  collection,
  joinAgreggation,
  limit,
  page = 1,
  pagination,
  projection,
  query = {},
  session,
  skip,
  sort,
  useEstimatedCount,
}: {
  adapter: MongooseAdapter
  collation?: CollationOptions
  collection: Collection
  joinAgreggation?: PipelineStage[]
  limit?: number
  page?: number
  pagination?: boolean
  projection?: Record<string, unknown>
  query?: Record<string, unknown>
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

  if (joinAgreggation) {
    const cursor = collection.aggregate(
      [
        {
          $match: query,
        },
      ],
      { collation, session },
    )

    if (sort) {
      cursor.sort(sort)
    }

    if (skip) {
      cursor.skip(skip)
    }

    if (limit) {
      cursor.limit(limit)
    }

    for (const stage of joinAgreggation) {
      cursor.addStage(stage)
    }

    if (projection) {
      cursor.project(projection)
    }

    docsPromise = cursor.toArray()
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
    if (useEstimatedCount) {
      countPromise = collection.estimatedDocumentCount()
    } else {
      // Improve the performance of the countDocuments query which is used if useEstimatedCount is set to false by adding
      // a hint. By default, if no hint is provided, MongoDB does not use an indexed field to count the returned documents,
      // which makes queries very slow. This only happens when no query (filter) is provided. If one is provided, it uses
      // the correct indexed field

      const hint = adapter.disableIndexHints !== true ? { _id: 1 } : undefined

      countPromise = collection.countDocuments(query, { collation, hint, session })
    }
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
