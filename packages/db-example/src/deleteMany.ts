/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DeleteMany } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const deleteMany: DeleteMany = async function deleteMany(
  this: ExampleAdapter,
  {
    collection, // The specified slug of your collection
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    where, // The specific query for querying the documents in question to delete
  },
) {
  /**
   * Implement the logic to delete many documents from your database.
   *
   * @example
   * ```ts
   * await adapterSpecificModel.deleteMany(query, options)
   * ```
   */
}
