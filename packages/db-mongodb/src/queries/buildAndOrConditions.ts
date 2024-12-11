import type { PipelineStage } from 'mongoose'
import type { FlattenedField, Payload, Where } from 'payload'

import { parseParams } from './parseParams.js'

export function buildAndOrConditions({
  collectionSlug,
  fields,
  globalSlug,
  locale,
  payload,
  pipeline,
  projection,
  where,
}: {
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  locale?: string
  payload: Payload
  pipeline: PipelineStage[]
  projection?: Record<string, boolean>
  where: Where[]
}): Record<string, unknown>[] {
  const completedConditions = []
  // Loop over all AND / OR operations and add them to the AND / OR query param
  // Operations should come through as an array

  for (const condition of where) {
    // If the operation is properly formatted as an object
    if (typeof condition === 'object') {
      const result = parseParams({
        collectionSlug,
        fields,
        globalSlug,
        locale,
        payload,
        pipeline,
        projection,
        where: condition,
      })
      if (Object.keys(result).length > 0) {
        completedConditions.push(result)
      }
    }
  }
  return completedConditions
}
