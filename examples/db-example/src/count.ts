/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Count } from 'payload/database'
import type { PayloadRequest, Where } from 'payload/types'

import type { ExampleAdapter } from '.'

/**
 * Counts the total number of documents that match the query in the specified collection.
 *
 * @param {ExampleAdapter} this - The ExampleAdapter instance.
 * @param {string} collection - The name of the collection to reference for counting documents.
 * @param {string} locale - The locale being used - can be one locale or "all" (locale="all").
 * @param {PayloadRequest} req - The Express request object containing the currently authenticated user.
 * @param {Where} where - The specific query used to find the documents for counting.
 * @returns {Promise<{ totalDocs: number }>} A promise resolving to an object containing the total number of documents.
 *
 * Implement the count function here for the specified collection and return the total number of documents that match the query.
 */
export const count: Count = async function count(
  this: ExampleAdapter,
  { collection, locale, req = {} as PayloadRequest, where },
): Promise<{ totalDocs: number }> {
  return {
    totalDocs: 0,
  }
}
