import type { Field, Payload, Where } from 'payload'

import { parseParams } from './parseParams.js'

export async function buildAndOrConditions({
  collectionSlug,
  fields,
  globalSlug,
  locale,
  payload,
  where,
}: {
  collectionSlug?: string
  fields: Field[]
  globalSlug?: string
  locale?: string
  payload: Payload
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
        where: condition,
      })
      if (Object.keys(result).length > 0) {
        completedConditions.push(result)
      }
    }
  }
  return completedConditions
}
