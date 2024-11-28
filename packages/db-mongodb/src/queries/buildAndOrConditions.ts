import type { ClientSession } from 'mongodb'
import type { FlattenedField, Payload, Where } from 'payload'

import { parseParams } from './parseParams.js'

export async function buildAndOrConditions({
  collectionSlug,
  fields,
  globalSlug,
  locale,
  payload,
  session,
  where,
}: {
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  locale?: string
  payload: Payload
  session?: ClientSession
  where: Where[]
}): Promise<Record<string, unknown>[]> {
  const completedConditions = []
  // Loop over all AND / OR operations and add them to the AND / OR query param
  // Operations should come through as an array

  for (const condition of where) {
    // If the operation is properly formatted as an object
    if (typeof condition === 'object') {
      const result = await parseParams({
        collectionSlug,
        fields,
        globalSlug,
        locale,
        payload,
        session,
        where: condition,
      })
      if (Object.keys(result).length > 0) {
        completedConditions.push(result)
      }
    }
  }
  return completedConditions
}
