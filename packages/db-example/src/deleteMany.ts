/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DeleteMany } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const deleteMany: DeleteMany = async function deleteMany(
  this: ExampleAdapter,
  {
    collection, // The name of the collection to reference for deleting documents
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    where, // The specific query used to find the documents for deleting
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
