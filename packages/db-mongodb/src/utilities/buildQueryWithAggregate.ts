import type { ClientSession, PipelineStage } from 'mongoose'
import type { GlobalSlug, Payload, Where } from 'payload'

import type { CollectionModel, GlobalModel } from '../types.js'

export const buildQueryWithAggregate = async ({
  globalSlug,
  locale,
  Model,
  payload,
  session,
  where,
}: {
  globalSlug?: GlobalSlug
  locale?: string
  Model: CollectionModel | GlobalModel
  payload: Payload
  session?: ClientSession
  where: Where
}) => {
  const pipeline: PipelineStage[] = []

  const query = Model.buildQuery({ globalSlug, locale, payload, pipeline, where })

  if (pipeline.length > 0) {
    pipeline.push({
      $match: query,
    })

    pipeline.push({ $project: { _id: true } })

    const result = await Model.aggregate(pipeline, { session })

    return {
      _id: {
        $in: result.map((each) => each._id),
      },
    }
  }

  return query
}
