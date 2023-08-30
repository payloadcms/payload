import type { SQL } from 'drizzle-orm'
import type { Field } from 'payload/types'
import type { Where } from 'payload/types'

import type { PostgresAdapter } from '../types.js'

import { parseParams } from './parseParams.js'

export async function buildAndOrConditions({
  adapter,
  collectionSlug,
  fields,
  globalSlug,
  locale,
  where,
}: {
  adapter: PostgresAdapter
  collectionSlug?: string
  fields: Field[]
  globalSlug?: string
  locale?: string
  where: Where[]
}): Promise<SQL[]> {
  const completedConditions = []
  // Loop over all AND / OR operations and add them to the AND / OR query param
  // Operations should come through as an array
  // eslint-disable-next-line no-restricted-syntax
  for (const condition of where) {
    // If the operation is properly formatted as an object
    if (typeof condition === 'object') {
      // eslint-disable-next-line no-await-in-loop
      const result = await parseParams({
        adapter,
        collectionSlug,
        fields,
        globalSlug,
        locale,
        where: condition,
      })
      if (Object.keys(result).length > 0) {
        completedConditions.push(result)
      }
    }
  }
  return completedConditions
}
