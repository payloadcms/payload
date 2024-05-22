/* eslint-disable @typescript-eslint/no-unused-vars */
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
  {
    collection, // The specified collection to reference for count
    locale, // The locale being used - you can only create docs in one locale at a time
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    where, // The specific query for querying the document in question to count
  },
): Promise<{ totalDocs: number }> {
  // Implement the count function here for the specified collection with where query
  const adapterSpecificModel = this.collections[collection]

  const result = await adapterSpecificModel.countDocuments()

  return {
    totalDocs: result,
  }
}
