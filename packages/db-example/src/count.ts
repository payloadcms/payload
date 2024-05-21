import type { Count } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Implement the count function here for the specified collection and return the total number of documents that match the query.
 *
 * @example
 * ```ts
 * const adapterSpecificModel = this.collections[collection]
 *
 * const result = await adapterSpecificModel.countDocuments(query)
 *
 * return { totalDocs: result }
 * ```
 */
export const count: Count = async function count(
  this: ExampleAdapter,
  { collection, locale, req = {} as PayloadRequest, where },
): Promise<{ totalDocs: number }> {
  // Implement the count function here for the specified collection with where query
  const result = await Promise.resolve(0)
  return {
    totalDocs: result,
  }
}
