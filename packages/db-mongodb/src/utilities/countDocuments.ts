import type { ClientSession, CollationOptions, Collection } from 'mongodb'
import type { PipelineStage } from 'mongoose'

import type { MongooseAdapter } from '../index.js'

export const countDocuments = async ({
  adapter,
  collation,
  collection,
  query,
  queryAggregation,
  session,
  useEstimatedCount,
}: {
  adapter: MongooseAdapter
  collation?: CollationOptions
  collection: Collection
  query: Record<string, unknown>
  queryAggregation?: PipelineStage[]
  session?: ClientSession
  useEstimatedCount?: boolean
}): Promise<number> => {
  if (useEstimatedCount) {
    return collection.estimatedDocumentCount()
  }

  const hint = adapter.disableIndexHints !== true ? { _id: 1 } : undefined

  if (queryAggregation?.length) {
    const aggregation = collection.aggregate([], { collation, hint, session })
    for (const stage of queryAggregation) {
      aggregation.addStage(stage)
    }

    aggregation.match(query)
    aggregation.addStage({ $count: 'count' })

    const result = await aggregation.toArray()

    if (result.length) {
      return result[0].count
    }

    // Without any documents MongoDB doesn't return even 0 element.
    return 0
  }

  return collection.countDocuments(query, { collation, hint, session })
}
