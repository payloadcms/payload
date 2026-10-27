import type { FlattenedField, Payload, PayloadRequest, Where } from 'payload'

import { parseParams } from './parseParams.js'

export async function buildAndOrConditions({
  branch,
  collectionSlug,
  fields,
  globalSlug,
  locale,
  parentIsLocalized,
  payload,
  req,
  where,
}: {
  branch?: false | string
  collectionSlug?: string
  fields: FlattenedField[]
  globalSlug?: string
  locale?: string
  parentIsLocalized: boolean
  payload: Payload
  req?: Partial<PayloadRequest>
  where: Where[]
}): Promise<Record<string, unknown>[]> {
  const completedConditions = []
  // Loop over all AND / OR operations and add them to the AND / OR query param
  // Operations should come through as an array

  for (const condition of where) {
    // If the operation is properly formatted as an object
    if (typeof condition === 'object') {
      const result = await parseParams({
        branch,
        collectionSlug,
        fields,
        globalSlug,
        locale,
        parentIsLocalized,
        payload,
        req,
        where: condition,
      })
      if (Object.keys(result).length > 0) {
        completedConditions.push(result)
      }
    }
  }
  return completedConditions
}
