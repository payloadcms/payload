/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DeleteVersions } from 'payload/database'
import type { PayloadRequest } from 'payload/types'

import type { ExampleAdapter } from '.'

export const deleteVersions: DeleteVersions = async function deleteVersions(
  this: ExampleAdapter,
  {
    collection, // The name of the collection to reference for deleting versions
    locale, // The locale being used - you can only create docs in one locale at a time
    req = {} as PayloadRequest, // The Express request object containing the currently authenticated user
    where, // The specific query used to find the documents for deleting versions
  },
) {
  /**
   * Implement the logic to delete many version documents from your database.
   *
   * @example
   * ```ts
   * await adapterSpecificVersionsModel.deleteMany(query, options)
   * ```
   */
}
